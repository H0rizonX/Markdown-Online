// useTokenStore.ts
import { create } from "zustand";
import {
  getToken as getTokenLocal,
  removeToken,
  setToken as setTokenLocal,
} from "../utils";

type TokenState = {
  token: string | null;

  // 设置 token
  setToken: (token: string | null) => void;

  // 清空 token
  clearToken: () => void;

  // 获取 token（优先 store，再 fallback localStorage）
  getToken: () => string | null;
};

export const useTokenStore = create<TokenState>((set, get) => ({
  // 初始化时尝试从 localStorage 读取
  token: getTokenLocal(),

  setToken: (token) => {
    set({ token });
    if (token === null) {
      removeToken();
    } else {
      setTokenLocal(token);
    }
  },

  clearToken: () => {
    set({ token: null });
    removeToken();
  },

  getToken: () => {
    const token = get().token;
    if (token) return token;

    const stored = getTokenLocal();
    if (stored) {
      set({ token: stored }); // 同步到 store
      return stored;
    }
    return null;
  },
}));
