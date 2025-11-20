import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = env.mail.enable
  ? nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth:
        env.mail.authUser && env.mail.authPass
          ? {
              user: env.mail.authUser,
              pass: env.mail.authPass,
            }
          : undefined,
    })
  : null;

if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.error("SMTP连接失败:", error);
    } else {
      console.log("SMTP连接成功");
    }
  });
} else {
  console.warn("⚠️ 邮件功能已禁用或未配置");
}

export const mailer = transporter;
