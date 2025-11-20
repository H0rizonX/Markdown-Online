import Redis from "ioredis";
import { env } from "./env";

const createRedisClient = () => {
  if (!env.redis.enable) {
    console.warn("⚠️ Redis 已禁用，相关功能将不可用");
    return {
      on: () => undefined,
      get: async () => null,
      set: async () => "OK",
      del: async () => 0,
    } as unknown as Redis;
  }

  const client = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    db: env.redis.db,
  });

  client.on("connect", () => {
    console.log("✅ Redis 正在连接中...");
  });

  client.on("ready", () => {
    console.log("✅ Redis 连接成功，可用");
  });

  client.on("error", (err) => {
    console.error("❌ Redis 连接出错:", err);
  });

  client.on("end", () => {
    console.warn("⚠️ Redis 连接已关闭");
  });

  return client;
};

const redis = createRedisClient();

export default redis;
