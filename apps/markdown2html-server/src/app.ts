import express, { Express, Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import { expressjwt } from "express-jwt";

import { result } from "./utils";
import { database } from "./config/database";
import userRoutes from "./controller/userController";
import articleRoutes from "./controller/articleController";
import teamRoutes from "./controller/teamController";
import { startWsServer } from "./ws-server";
import { startYjsWsServer } from "./yjs-ws-server";
import { env } from "./config/env";
import { ensureCollabServer } from "./service/collabManager";

const app: Express = express();

// 启动协同与 WebSocket 服务，可根据环境变量开关
if (env.collab.enable) {
  ensureCollabServer();
}
if (env.realtime.enable) {
  startWsServer(env.realtime.port);
}
if (env.yjs.enable) {
  startYjsWsServer(env.yjs.port);
}

// 解析表单数据中间件   application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// CORS
const corsOptions: CorsOptions = env.cors.allowAll
  ? {
      origin: true, // mirror request origin so credentials work
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    }
  : {
      origin: env.cors.origins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    };
app.use(cors(corsOptions));

// 返回结构封装
app.use(result);
// 解析JSON格式
app.use(express.json());

// jwt验证
app.use(
  expressjwt({
    secret: env.jwt.secret,
    algorithms: ["HS256"],
  }).unless({
    path: env.jwt.publicRoutes,
  })
);

// jwt 授权失败兜底
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      code: 401,
      message: err.message || "令牌无效或已过期",
      data: null,
      status: 1,
    });
  }
  return next(err);
});

app.use("/users", userRoutes);
app.use("/article", articleRoutes);
app.use("/team", teamRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

database
  .initialize()
  .then(() => {
    console.log("✅ Database connected");
    app.listen(env.port, env.host, () => {
      console.log(
        `🚀 Server started at http://${env.host === "0.0.0.0" ? "localhost" : env.host}:${env.port}`
      );
    });
  })
  .catch((error) => {
    console.error("❌ 数据库启动失败，请检查连接", error);
    process.exit(1);
  });
