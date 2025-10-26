import nodemailer from "nodemailer";

export const transporterQQ = nodemailer.createTransport({
  host: "smtp.qq.com",
  port: 465,
  secure: true,
  auth: {
    user: "fordream.you@qq.com",
    pass: "luvknlkqvmtffgib",
  },
});

transporterQQ.verify((error) => {
  if (error) {
    console.error("SMTP连接失败:", error);
  } else {
    console.log("SMTP连接成功");
  }
});
