import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decodeJwt } from "@/libs/shared/utils/jwt";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  avatar: string | null;
  fullName: string | null;
  permissions: string[];
  roleCode: string | null;
  accountType: string | null;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setAvatar: (avatar: string | null) => void;
  setFullName: (fullName: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      avatar: null,
      fullName: null,
      permissions: [],
      roleCode: null,
      accountType: null,
      setAccessToken: (token) => {
        if (!token) {
          set({ accessToken: null, permissions: [], roleCode: null, accountType: null });
          return;
        }
        const decoded = decodeJwt(token);
        set({
          accessToken: token,
          permissions: decoded?.permissions || [],
          roleCode: decoded?.roleCode || null,
          accountType: decoded?.accountType || null,
        });
      },
      setRefreshToken: (token) => set({ refreshToken: token }),
      setAvatar: (avatar) => set({ avatar }),
      setFullName: (fullName) => set({ fullName }),
      logout: () => set({
        accessToken: null,
        refreshToken: null,
        avatar: null,
        fullName: null,
        permissions: [],
        roleCode: null,
        accountType: null,
      }),
    }),
    {
      name: "auth-storage", // Key used in localStorage
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        fullName: state.fullName,
        permissions: state.permissions,
        roleCode: state.roleCode,
        accountType: state.accountType,
        avatar: state.avatar && !state.avatar.startsWith('data:') ? state.avatar : null,
      }),
    }
  )
);