import { useAuthStore } from "@/libs/tts/store/auth.store";

export function useHasPermission() {
  const permissions = useAuthStore((state) => state.permissions);
  const roleCode = useAuthStore((state) => state.roleCode);

  const hasPermission = (permissionCode: string): boolean => {
    if (roleCode === 'ADMIN') {
      return true;
    }
    return permissions.includes(permissionCode);
  };

  return { hasPermission, permissions, roleCode };
}
