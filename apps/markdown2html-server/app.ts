import express, { Express } from "express";
import cors from "cors";
import { result } from "./src/utils";
import { database } from "./src/config/database";
import userRoutes from "./src/controller/userController";
// import redis from "redis";
// import nodemailer from "nodemailer";
/* import { expressjwt } from "express-jwt";
import { webToken } from "./config"; */

const app: Express = express();

// 解析表单数据中间件   application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
// 跨域问题
app.use(cors());
// 返回结构封装
app.use(result);
// 解析JSON格式
app.use(express.json());

// jwt验证
/* app.use(
  expressjwt({ secret: webToken.jwtSecretKey, algorithms: ["HS256"] }).unless({
    path: [
      { url: /^\/users\/?$/, methods: ["GET", "POST", "PUT", "DELETE"] },
      { url: /^\/users\/register\/?$/, methods: ["POST"] },
    ],
  })
); */
database
  .initialize()
  .then(() => {
    console.log("Database connected");

    app.use("/users", userRoutes);

    app.listen(3003, () =>
      console.log("Server started at http://localhost:3003")
    );
  })
  .catch(() => {
    console.log("数据库启动失败，请检查连接");
  });
