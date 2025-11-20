import { env } from "./env";

export const getMailOptions = (toEmail: string, code: number) => ({
  from: env.mail.from || "noreply@example.com",
  to: toEmail,
  subject: "您的验证码",
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; padding: 30px;">
      <div style="max-width: 500px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 30px;">
        <h2 style="text-align: center; color: #007bff;">🔐 验证码安全通知</h2>
        <p style="font-size: 16px; color: #333;">您好，</p>
        <p style="font-size: 16px; color: #333;">您正在进行身份验证操作，请在输入框中填写以下验证码：</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #007bff;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #666;">验证码有效期为 <strong>5分钟</strong>，请勿泄露给他人。</p>
        <p style="font-size: 14px; color: #aaa; margin-top: 40px; text-align: center;">如果这不是您本人的操作，请忽略此邮件。</p>
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
          本邮件由系统自动发送，请勿直接回复。
        </p>
      </div>
    </div>
  `,
});
