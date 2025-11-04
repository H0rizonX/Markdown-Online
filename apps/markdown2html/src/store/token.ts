// useTokenStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type TokenState = {
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
};

export const useTokenStore = create<TokenState>()(
  persist(
    (set) => ({
      token: null,

      setToken: (token) => set({ token }),

      clearToken: () => set({ token: null }),
    }),
    {
      name: "token-storage", // localStorage key
    }
  )
);
