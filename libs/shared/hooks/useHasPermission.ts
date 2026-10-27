import { useAuthStore } from "@/libs/tts/store/auth.store";
import { decodeJwt } from "../utils/jwt";

export function useHasPermission() {
  const permissions = useAuthStore((state) => state.permissions);
  const roleCode = useAuthStore((state) => state.roleCode);
  const accountType = useAuthStore((state) => state.accountType);
  const accessToken = useAuthStore((state) => state.accessToken);

  const hasPermission = (permissionCode: string): boolean => {
    const decoded = accessToken ? decodeJwt(accessToken) : null;
    const currentUsername = decoded?.username || (typeof window !== 'undefined' ? localStorage.getItem('current_username') : null);
    const activeRole = roleCode || accountType || (decoded as any)?.role || decoded?.roleCode;

    // 1. Quản trị viên (ADMIN): Luôn luôn có toàn quyền tuyệt đối 100%
    if (
      activeRole === 'ADMIN' ||
      currentUsername === 'admin' ||
      (currentUsername && currentUsername.toLowerCase().includes('admin'))
    ) {
      return true;
    }

    // 2. Lãnh đạo / Quản lý (MANAGER)
    if (activeRole === 'MANAGER') {
      const managerAllowed = [
        // Doanh nghiệp: Xem, tạo mới, chỉnh sửa, khóa/mở khóa, đặt lại mật khẩu, xóa
        'VIEW_COMPANY',
        'CREATE_COMPANY',
        'UPDATE_COMPANY',
        'BAN_COMPANY',
        'DELETE_COMPANY',
        'RESET_PWD_COMPANY',
        // Báo cáo & sự cố
        'VIEW_REPORT',
        'APPROVE_REPORT',
        'REJECT_REPORT',
        'CREATE_REPORT',
        'UPDATE_REPORT',
        // Người dùng: Được xem danh sách cán bộ cấp dưới
        'VIEW_USER',
      ];
      return managerAllowed.includes(permissionCode) || permissions.includes(permissionCode);
    }

    // 3. Chuyên viên / Nhân viên (EMPLOYEE)
    if (activeRole === 'EMPLOYEE') {
      const employeeAllowed = [
        // Doanh nghiệp: Chỉ xem, hỗ trợ tạo & cập nhật thông tin (KHÔNG xóa, KHÔNG khóa, KHÔNG reset MK)
        'VIEW_COMPANY',
        'CREATE_COMPANY',
        'UPDATE_COMPANY',
        // Báo cáo: Xem & tiếp nhận số liệu
        'VIEW_REPORT',
        'CREATE_REPORT',
      ];
      return employeeAllowed.includes(permissionCode) || permissions.includes(permissionCode);
    }

    // 4. Doanh nghiệp (DOANH_NGHIEP)
    if (activeRole === 'DOANH_NGHIEP') {
      const enterpriseAllowed = [
        'VIEW_REPORT',
        'CREATE_REPORT',
        'UPDATE_REPORT',
      ];
      return enterpriseAllowed.includes(permissionCode) || permissions.includes(permissionCode);
    }

    return permissions.includes(permissionCode);
  };

  return { hasPermission, permissions, roleCode, accountType };
}
