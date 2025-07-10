// src/controller/UserController.ts
import express, { Response, Request } from "express";
import { UserService } from "../service/userService";
import expressJoi from "@escook/express-joi";
import { userCreateSchema } from "../schema/user";
import { randomName } from "../utils";
import bcrypt from "bcryptjs";

const router = express.Router();
const userService = new UserService();

router.get("/all", async (req: Request, res: Response) => {
  const users = await userService.findAll();
  res.suc(users);
});

router.get("/", async (req: Request, res: Response) => {
  const data = { ...req.body };
  const identifier = data.id ?? data.email;
  const user = await userService.login(identifier);
  console.log(user, "是否存在该用户");
  if (!user) {
    return res.suc("用户不存在");
  }
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    return res.suc("用户名或密码错误");
  }
  delete user.password;
  return res.suc(user, 200, "登录成功", 0);
});

// 使用 Joi 校验请求体
router.post(
  "/",
  expressJoi(userCreateSchema),
  async (req: Request, res: Response) => {
    const data = { ...req.body };
    if (!data.name) {
      data.name = randomName();
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

export default router;
