import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  // password: 'your_password', // 如果配置了密码
  // db: 0                      // 默认使用第0个数据库
});
// 连接成功
redis.on("connect", () => {
  console.log("✅ Redis 正在连接中...");
});

redis.on("ready", () => {
  console.log("✅ Redis 连接成功，可用");
});

// 连接出错
redis.on("error", (err) => {
  console.error("❌ Redis 连接出错:", err);
});

// 断开连接
redis.on("end", () => {
  console.warn("⚠️ Redis 连接已关闭");
});
export default redis;
