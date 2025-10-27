import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import http from "http";

import os from "os";

interface UserInfo {
  userId: string;
  conn: WebSocket;
}

interface RoomInfo {
  id: string;
  users: Map<string, UserInfo>;
}

function getServerIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address; // 返回第一个非内网 IPv4
      }
    }
  }
  return "127.0.0.1"; // fallback
}

const ip = getServerIp();

export class CollabService {
  private wss?: WebSocketServer;
  private rooms: Map<string, RoomInfo> = new Map();

  constructor(private port: number) {}

  public start() {
    const server = http.createServer();
    this.wss = new WebSocketServer({ noServer: true });

    // 根据 URL 区分房间
    server.on("upgrade", (req, socket, head) => {
      const url = req.url || "";
      const match = url.match(/^\/room\/(.+)/);
      if (!match) {
        socket.destroy();
        return;
      }
      const roomId = match[1];
      const room = this.rooms.get(roomId);
      if (!room) {
        socket.destroy();
        return;
      }

      this.wss!.handleUpgrade(req, socket, head, (ws) => {
        const userId = uuidv4();
        room.users.set(userId, { userId, conn: ws });
        ws.send(JSON.stringify({ success: `Joined room ${roomId}`, userId }));

        ws.on("message", (msg) => {
          for (const [uid, user] of room.users.entries()) {
            if (uid !== userId) user.conn.send(msg.toString());
          }
        });

        ws.on("close", () => {
          room.users.delete(userId);
        });
      });
    });

    server.listen(this.port, () => {
      console.log(`Server listening on http://${ip}:${this.port}`);
    });
  }

  // 创建房间
  public createRoom(): string {
    const roomId = uuidv4();
    this.rooms.set(roomId, { id: roomId, users: new Map() });
    // 返回前端可以直接连接的 ws URL
    return `ws://${ip}:${this.port}/room/${roomId}`;
  }
}
