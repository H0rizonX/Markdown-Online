// src/controller/UserController.ts
import express, { Response, Request } from "express";
import { UserService } from "../service/userService";
import expressJoi from "@escook/express-joi";
import { userCreateSchema } from "../schema/user";
import { generateShortId, generateSnowflakeId } from "../utils";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { webToken } from "../../config";
import { transporterQQ } from "../utils";
import { getMailOptions } from "../config/emailTemplate";
import redis from "../config/redis";

const router = express.Router();
const userService = new UserService();

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
  const tokenStr = jwt.sign({ userId: user.id }, webToken.jwtSecretKey, {
    expiresIn: webToken.expiresIn,
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

    // 验证并解码 token
    const decoded = jwt.verify(token, webToken.jwtSecretKey) as {
      userId: number;
    };

    // 根据 userId 查询用户
    const user = await userService.getUser(decoded.userId);
    if (!user) return res.fail("用户不存在");

    delete user.password;

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

    const dbUser = await userService.getUser(data.email);
    const codeKey = `email:code:${data.code}`;
    const emailFromRedis = await redis.get(codeKey);

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

    const user = await userService.create(data);
    delete user.password;
    res.suc(user);
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
  const fromEmail = req.body.email;
  const code = Math.floor(Math.random() * 900000) + 100000;
  const limitKey = `email:limit:${fromEmail}`;
  const codeKey = `email:code:${code}`;
  const isLimited = await redis.get(limitKey);

  if (isLimited) {
    return res.fail("请求过于频繁，请稍后再试");
  }

  try {
    await transporterQQ.sendMail(getMailOptions(fromEmail, code));
    res.suc(null, 200, "验证码发送成功", 0);
    await redis.set(fromEmail, code, "EX", 300); // 5分钟过期
    await redis.set(limitKey, "1", "EX", 60); // 60秒限制
    await redis.set(codeKey, fromEmail, "EX", 300); // 保存验证码与邮箱的绑定
  } catch (error) {
    console.error("发送邮件出错:", error);
    res.status(500).json({ message: "邮件发送失败", error });
  }
});

// 修改密码
router.post("/reset-password", async (req: Request, res: Response) => {
  const data = { ...req.body };
  const codeKey = `email:code:${data.code}`;
  const emailFromRedis = await redis.get(codeKey);

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

export default router;
