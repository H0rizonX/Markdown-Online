// src/service/articleService.ts

import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { setupWSConnection } from "y-websocket/bin/utils";

export class ArticleService {
  private wss: WebSocketServer | null = null;
  private userConnections = new Map<string, WebSocket>();

  // 启动协同服务器
  openLink = (port = 8990) => {
    if (this.wss) {
      console.log("⚠️ WebSocket 已经启动，无需重复启动");
      return;
    }

    this.wss = new WebSocketServer({ port });

    this.wss.on("connection", (conn, req: IncomingMessage) => {
      const url = req.url || "";
      const query = new URLSearchParams(url.split("?")[1]);
      const docName = url.slice(1).split("?")[0] || "default";

      const userId = query.get("userId") || "anonymous";

      // 若用户已有连接，关闭旧的
      const oldConn = this.userConnections.get(userId);
      if (oldConn && oldConn.readyState === oldConn.OPEN) {
        console.log(`⚠️ 用户 ${userId} 已有连接，关闭旧连接`);
        oldConn.close(4001, "重复连接");
      }

      // 保存新连接
      this.userConnections.set(userId, conn);

      // 连接关闭时清除记录
      conn.on("close", () => {
        if (this.userConnections.get(userId) === conn) {
          this.userConnections.delete(userId);
        }
      });

      // 交由 y-websocket 管理同步逻辑
      setupWSConnection(conn, req, { docName });
    });

    console.log(`✅ y-websocket v2 协同服务器已启动 ws://localhost:${port}`);
  };

  // 关闭协同服务器
  closeLink = () => {
    if (this.wss) {
      console.log("🛑 正在关闭 WebSocket 服务器...");
      this.wss.clients.forEach((client) => client.close());
      this.wss.close(() => {
        console.log("✅ WebSocket 服务器已关闭");
        this.wss = null;
        this.userConnections.clear();
      });
    } else {
      console.log("⚠️ WebSocket 服务器未启动");
    }
  };
}
