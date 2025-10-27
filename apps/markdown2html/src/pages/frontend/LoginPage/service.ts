import type { resType } from "../../../types/common";
import { request } from "../../../utils";

export type LoginType = {
  identify: number | string;
  password: string;
  status: number;
};

export type registerType = {
  email: string;
  password?: string;
};

export type resetType = registerType & {
  code: string; // 验证码
};

export const Login = async (params: LoginType): Promise<resType> => {
  return await request.post("/users", params);
};

// 获取验证码
export const sendEmail = async (params: registerType): Promise<resType> => {
  return await request.post("/users/send-email", params);
};

// 注册
export const Register = async (params: registerType): Promise<resType> => {
  return await request.post("/users/register", params);
};

export const resetPassword = async (params: registerType): Promise<resType> => {
  return await request.post("/users/reset-password", params);
};
