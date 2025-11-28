// src/controller/UserController.ts
import express, { Response, Request } from "express";
import { UserService } from "../service/userService";
import expressJoi from "@escook/express-joi";
import { userCreateSchema } from "../schema/user";
import { generateShortId, generateSnowflakeId, mailer } from "../utils";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { getMailOptions } from "../config/emailTemplate";
import redis from "../config/redis";
import fs from "fs";
import ossClient from "../config/ali-oss";
import multer from "multer";
const router = express.Router();
const userService = new UserService();

const normalizeEmail = (email?: string) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

type CacheEntry = {
  value: string;
  expireAt?: number;
};

const fallbackCache = new Map<string, CacheEntry>();

const isExpired = (entry: CacheEntry) =>
  typeof entry.expireAt === "number" && entry.expireAt <= Date.now();

const getFromFallback = (key: string) => {
  const entry = fallbackCache.get(key);
  if (!entry) return null;
  if (isExpired(entry)) {
    fallbackCache.delete(key);
    return null;
  }
  return entry.value;
};

const setInFallback = (key: string, value: string, ttlSeconds?: number) => {
  const record: CacheEntry = { value };
  if (ttlSeconds && ttlSeconds > 0) {
    record.expireAt = Date.now() + ttlSeconds * 1000;
  }
  fallbackCache.set(key, record);
};

const safeGet = async (key: string) => {
  try {
    const value = await redis.get(key);
    if (value !== null) return value;
  } catch (error) {
    console.warn(`[Redis] get ${key} failed, fallback to memory`, error);
  }
  return getFromFallback(key);
};

const safeSet = async (key: string, value: string | number, ttlSeconds?: number) => {
  const normalized = String(value);
  if (ttlSeconds && ttlSeconds > 0) {
    try {
      await redis.set(key, normalized, "EX", ttlSeconds);
      return;
    } catch (error) {
      console.warn(`[Redis] set ${key} failed, fallback to memory`, error);
    }
    setInFallback(key, normalized, ttlSeconds);
    return;
  }
  try {
    await redis.set(key, normalized);
  } catch (error) {
    console.warn(`[Redis] set ${key} failed, fallback to memory`, error);
    setInFallback(key, normalized);
  }
};

const upload = multer({ dest: "uploads/" });

const getUserInfo = async (token) => {
  // 验证并解码 token
  const decoded = jwt.verify(token, env.jwt.secret) as {
    userId: number;
  };

  // 根据 userId 查询用户
  const user = await userService.getUser(decoded.userId);

  delete user.password;
  return user;
};

router.get("/all", async (req: Request, res: Response) => {
  const users = await userService.findAll();
  res.suc(users);
});

router.post("/", async (req: Request, res: Response) => {
  const data = { ...req.body };
  console.log("请求登录");
  const user = await userService.getUser(data.identify);
  if (!user) {
    return res.fail("用户名或密码错误");
  }
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    return res.fail("用户名或密码错误");
  }
  const tokenStr = jwt.sign({ userId: user.id }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
  return res.suc({ token: tokenStr }, 200, "登录成功");
});

router.get("/info", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.fail("token");
    }
    const token = authHeader.split(" ")[1];

    const user = await getUserInfo(token);
    return res.suc({ user }, 200, "获取用户信息成功");
  } catch (err) {
    console.error("解析 token 失败:", err);
    return res.fail("token 无效或已过期");
  }
});

// 使用 Joi 校验请求体
router.post(
  "/register",
  expressJoi(userCreateSchema),
  async (req: Request, res: Response) => {
    const data = { ...req.body };
    data.email = normalizeEmail(data.email);

    const dbUser = await userService.getUser(data.email);
    const codeKey = `email:code:${data.code}`;
    const emailFromRedis = await safeGet(codeKey);

    if (!emailFromRedis) {
      return res.fail("验证码已过期或无效");
    }

    if (emailFromRedis !== data.email) {
      return res.fail("邮箱已修改，请重新获取验证码");
    }

    if (dbUser) {
      return res.fail("该邮箱已注册，请勿重复！");
    }

    if (data.id) return res.fail("错误请求");
    data.id = Number(generateShortId());

    if (!data.name) {
      data.name = "user" + (Number(generateSnowflakeId()) % 1000);
    }

    if (!data.avatar) {
      data.avatar = "https://api.dicebear.com/7.x/miniavs/svg?seed=1";
    }

    const saltRounds = 10;
    data.password = await bcrypt.hash(data.password, saltRounds);

    try {
      const user = await userService.create(data);
      delete user.password;
      res.suc(user);
    } catch (error) {
      const driverCode = (error as { code?: string; errno?: number }).code;
      const errno = (error as { errno?: number }).errno;
      if (driverCode === "ER_DUP_ENTRY" || errno === 1062) {
        return res.fail("该邮箱已注册，请勿重复！");
      }
      console.error("注册失败:", error);
      return res.fail("注册失败，请稍后重试");
    }
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  await userService.delete(+req.params.id);
  res.suc({ message: "删除成功" });
});

router.post("/update/:id", async (req: Request, res: Response) => {
  const data = { ...req.body };
  // 防止有人直接通过接口修改id
  if (data.id !== +req.params.id) return res.suc(null, 200, "Error： diff id");
  const result = await userService.update(+req.params.id, data);
  if (result.affected === 1) return res.suc(req.body, 200, "用户信息更新成功");
  return res.suc(null, 400, "更新用户资料失败，请稍后重试");
});

// 邮件发送
router.post("/send-email", async (req: Request, res: Response) => {
  const fromEmail = normalizeEmail(req.body.email);
  if (!fromEmail) {
    return res.fail("请输入有效的邮箱地址");
  }
  const code = Math.floor(Math.random() * 900000) + 100000;
  const limitKey = `email:limit:${fromEmail}`;
  const codeKey = `email:code:${code}`;
  const isLimited = await safeGet(limitKey);

  if (isLimited) {
    return res.fail("请求过于频繁，请稍后再试");
  }

  if (!mailer) {
    return res.fail("邮件服务未启用，请联系管理员");
  }

  try {
    let emailSent = false;

    try {
      if (!mailer) {
        throw new Error("邮件服务未启用，请联系管理员");
      }
      await mailer.sendMail(getMailOptions(fromEmail, code));
      emailSent = true;
    } catch (error) {
      console.error("发送邮件出错:", error);
      if (env.nodeEnv === "production") {
        return res.status(500).json({ message: "邮件发送失败", error });
      }
      console.warn("邮件服务不可用，开发环境将直接返回验证码");
    }

    await safeSet(fromEmail, code, 300); // 5分钟过期
    await safeSet(limitKey, "1", 60); // 60秒限制
    await safeSet(codeKey, fromEmail, 300); // 保存验证码与邮箱的绑定

    if (!mailer || !emailSent) {
      console.info(`当前验证码（开发模式）：${code}，邮箱：${fromEmail}`);
    }

    const payload =
      env.nodeEnv === "production" ? null : { code, email: fromEmail };
    const message = emailSent
      ? "验证码发送成功"
      : "验证码已生成（开发模式）";

    res.suc(payload, 200, message, 0);
  } catch (error) {
    console.error("发送验证码流程异常:", error);
    res.status(500).json({ message: "邮件发送失败", error });
  }
});

// 修改密码
router.post("/reset-password", async (req: Request, res: Response) => {
  const data = { ...req.body };
  const codeKey = `email:code:${data.code}`;
  const emailFromRedis = await safeGet(codeKey);

  if (!emailFromRedis) {
    return res.fail("验证码已过期或无效");
  }

  if (emailFromRedis !== data.email) {
    return res.fail("邮箱已修改，请重新获取验证码");
  }

  const user = await userService.getUser(data.email);
  if (!user) return res.fail("用户不存在，请确认邮箱是否正确");
  const saltRounds = 10;
  user.password = await bcrypt.hash(data.password, saltRounds);

  const result = await userService.update(+user.id, user);
  console.log(result);
  if (result.affected >= 1) return res.suc("密码修改成功");
  return res.fail("服务器错误，请稍后重试修改密码", 500, 1);
});

// 阿里云上传oss
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "未检测到上传文件" });
      }

      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.fail("token");
      }
      const token = authHeader.split(" ")[1];

      const user = await getUserInfo(token);
      if (user.avatar) {
        try {
          const oldFileKey = user.avatar.split("/").slice(3).join("/");

          await ossClient.delete(oldFileKey);
        } catch (deleteErr) {
          console.warn("删除旧头像失败：", deleteErr);
        }
      }

      //生成唯一文件名
      const ossFileName = `uploads/${Date.now()}_${file.originalname}`;

      // 上传到 OSS
      const result = await ossClient.put(ossFileName, file.path);

      // 删除临时文件
      fs.unlinkSync(file.path);

      // 更新数据库
      user.avatar = result.url;

      await userService.update(user.id, user);

      // 返回 OSS 文件地址
      return res.suc(user);
    } catch (err) {
      console.error("上传出错：", err);
      return res.status(500).json({ message: "上传失败", error: err.message });
    }
  }
);

export default router;
