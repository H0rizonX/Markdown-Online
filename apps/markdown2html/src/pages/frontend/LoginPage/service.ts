import type { resType } from "../../../types/common";
import { request } from "../../../utils";
import type { LoginType, registerType } from "./interface";

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

export const getUserInfo = async (token: string): Promise<resType> => {
  return await request.get("/users/info", {
    headers: {
      Authorization: `Bearer ${token}`, // 👈 注意这里一定要加 "Bearer "
    },
  });
};
