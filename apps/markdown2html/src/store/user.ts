import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserType = {
  id: number;
  name: string;
  email: string;
  avatar: string;
};

type UserStore = {
  userInfo: UserType | null;
  isLoggedIn: boolean;
  login: (user: UserType) => void;
  logout: () => void;
  updateUser: (newInfo: Partial<UserType>) => void; // Partial 允许只更新部分字段
};

const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userInfo: null,
      isLoggedIn: false,
      login: (user) => set({ userInfo: user, isLoggedIn: true }),
      logout: () => set({ userInfo: null, isLoggedIn: false }),
      updateUser: (newInfo) =>
        set((state) => ({
          userInfo: state.userInfo ? { ...state.userInfo, ...newInfo } : null,
        })),
    }),
    {
      name: "user-storage", // localStorage key
    }
  )
);

export default useUserStore;
