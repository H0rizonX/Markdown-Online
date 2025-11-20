import { config as loadEnv } from "dotenv";

loadEnv();

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const parseOrigins = (raw: string | undefined): string[] => {
  if (!raw || raw.trim() === "") return ["*"];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const stripQuotes = (value: string | undefined): string =>
  value ? value.replace(/^['"]|['"]$/g, "").trim() : "";

const publicRoutes = [
  { url: /^\/users\/?$/, methods: ["GET", "POST", "PUT", "DELETE"] },
  { url: /^\/users\/register\/?$/, methods: ["POST"] },
  { url: /^\/users\/info\/?$/, methods: ["GET"] },
  { url: /^\/users\/send-email\/?$/, methods: ["POST"] },
];

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: toNumber(process.env.PORT, 3003),
  jwt: {
    secret: process.env.JWT_SECRET ?? "<HOR1Z0N />",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "10h",
    publicRoutes,
  },
  cors: (() => {
    const origins = parseOrigins(process.env.CORS_ORIGIN);
    return {
      origins,
      allowAll: origins.length === 1 && origins[0] === "*",
    };
  })(),
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: toNumber(process.env.DB_PORT, 3306),
    username: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "123456",
    database: process.env.DB_NAME ?? "markdown",
    synchronize: toBoolean(process.env.DB_SYNC, true),
    logging: toBoolean(process.env.DB_LOGGING, false),
  },
  redis: {
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: toNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD,
    db: toNumber(process.env.REDIS_DB, 0),
    enable: toBoolean(process.env.REDIS_ENABLE, true),
  },
  mail: {
    host: process.env.EMAIL_HOST ?? "smtp.qq.com",
    port: toNumber(process.env.EMAIL_PORT, 465),
    secure: toBoolean(process.env.EMAIL_SECURE, true),
    authUser: process.env.EMAIL_USER ?? "",
    authPass: process.env.EMAIL_PASS ?? "",
    from: stripQuotes(process.env.EMAIL_FROM) || process.env.EMAIL_USER || "",
    enable: toBoolean(process.env.EMAIL_ENABLE, true),
  },
  oss: {
    region: process.env.OSS_REGION ?? "",
    accessKeyId: process.env.OSS_ACCESS_KEY_ID ?? "",
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET ?? "",
    bucket: process.env.OSS_BUCKET ?? "",
    enable: toBoolean(process.env.OSS_ENABLE, true),
  },
  collab: {
    enable: toBoolean(process.env.COLLAB_ENABLE, true),
    port: toNumber(process.env.COLLAB_PORT, 8990),
  },
  realtime: {
    enable: toBoolean(process.env.WS_ENABLE, true),
    port: toNumber(process.env.WS_PORT, 3001),
  },
  yjs: {
    enable: toBoolean(process.env.YJS_ENABLE, true),
    port: toNumber(process.env.YJS_WS_PORT, 3004),
  },
};
