import { useAuthStore } from "@/libs/tts/store/auth.store";
import { decodeJwt } from "../utils/jwt";

export function useHasPermission() {
  const permissions = useAuthStore((state) => state.permissions);
  const roleCode = useAuthStore((state) => state.roleCode);
  const accessToken = useAuthStore((state) => state.accessToken);

  const hasPermission = (permissionCode: string): boolean => {
    // Tạm thời kiểm tra nếu là tài khoản quản trị admin thì cho full quyền
    const decoded = accessToken ? decodeJwt(accessToken) : null;
    const currentUsername = decoded?.username || (typeof window !== 'undefined' ? localStorage.getItem('current_username') : null);

    if (
      roleCode === 'ADMIN' ||
      currentUsername === 'admin' ||
      (currentUsername && currentUsername.toLowerCase().includes('admin'))
    ) {
      return true;
    }
    return permissions.includes(permissionCode);
  };

  return { hasPermission, permissions, roleCode };
}

