// 用户信息管理工具

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

const USER_KEY = "user_info";

/**
 * 存储用户信息到 localStorage
 */
export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * 获取当前登录用户信息
 */
export function getUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) {
    return null;
  }
  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error("解析用户信息失败:", error);
    return null;
  }
}

/**
 * 清除用户信息
 */
export function removeUser(): void {
  localStorage.removeItem(USER_KEY);
}

/**
 * 检查是否已登录（同时检查 token 和用户信息）
 */
export function isLoggedIn(): boolean {
  const token = localStorage.getItem("token_key");
  const user = getUser();
  return !!(token && user);
}


