'use client';



import React, { useEffect, useState } from 'react';

import toast from 'react-hot-toast';

import { api } from '@/libs/core/api/axios';

import { AxiosError } from 'axios';

import { UserItem, UserPreviewItem } from '../interfaces/user.interface';

import { BackendUserListResponse } from '../interfaces/user.interface'; 

import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/libs/tts/store/auth.store';

import { useHasPermission } from '@/libs/shared/hooks/useHasPermission';



interface UserListProps {

  onViewDeleted?: () => void;

}



export const UserList = ({ onViewDeleted }: UserListProps) => {

  const { hasPermission } = useHasPermission();

  const colSpanCount = 8;

  const [users, setUsers] = useState<UserItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const router = useRouter();

  const { logout } = useAuthStore();

  const currentLoginUser = localStorage.getItem('current_username');



  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  const [isDeleting, setIsDeleting] = useState<boolean>(false);



  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);

  const [isBatchDeleting, setIsBatchDeleting] = useState<boolean>(false);

  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  const [importFile, setImportFile] = useState<File | null>(null);

  const [isImporting, setIsImporting] = useState<boolean>(false);

  const [previewData, setPreviewData] = useState<UserPreviewItem[]>([]);

  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);

  const [searchFullName, setSearchFullName] = useState<string>('');

  const [searchUsername, setSearchUsername] = useState<string>('');

  const [searchEmail, setSearchEmail] = useState<string>('');

  const [selectedRole, setSelectedRole] = useState<string>('');

  const [searchPosition, setSearchPosition] = useState<string>(''); 

  const [selectedStatus, setSelectedStatus] = useState<string>('');



  const [currentPage, setCurrentPage] = useState<number>(1);

  const [pageSize, setPageSize] = useState<number>(10);



  const [selectedUserIds, setSelectedUserIds] = useState<(string | number)[]>([]);



  const [showResetPwdModal, setShowResetPwdModal] = useState<boolean>(false);

  const [targetResetUsername, setTargetResetUsername] = useState<string>('');

  const [newPassword, setNewPassword] = useState<string>('');

  const [pwdError, setPwdError] = useState<string>('');



  const [showTextPassword, setShowTextPassword] = useState<boolean>(false);

  const [targetResetId, setTargetResetId] = useState<string | number | null>(null);



  useEffect(() => {

    setCurrentPage(1);

  }, [searchFullName, searchUsername, searchEmail, selectedRole, searchPosition, selectedStatus]);



  const fetchUsers = async () => {

    setIsLoading(true);

    try {

      const response = await api.get<BackendUserListResponse>('/users');

      const responseData = response.data;

      const rawList = responseData?.data?.items || responseData?.items || (Array.isArray(responseData) ? responseData : []);



      if (!Array.isArray(rawList)) {

        setUsers([]);

        return;

      }



      // Lọc bỏ tài khoản doanh nghiệp, chỉ hiển thị nhân viên / quản trị viên nội bộ

      const internalUsers = rawList.filter((user: any) => {

        const roleVal = user.role?.code || user.role?.name || user.role;

        const upper = String(roleVal || '').toUpperCase();

        const isBusiness =

          upper.includes('DOANH_NGHIEP') ||

          upper.includes('ENTERPRISE') ||

          upper.includes('DOANH NGHIỆP') ||

          Boolean(user.businessId);

        return !isBusiness;

      });



      const mappedUsers: UserItem[] = internalUsers.map((user: any) => ({

        id: user.id,

        accountId: user.id,

        fullName: user.fullName || '---',

        username: user.username,

        email: user.email,

        role: user.role === 'ADMIN' ? 'Quản trị viên' : (user.role === 'MANAGER' ? 'Lãnh đạo' : (user.role === 'EMPLOYEE' ? 'Chuyên viên' : (user.role === 'DOANH_NGHIEP' ? 'Doanh nghiệp' : (user.role?.name || user.role || 'Người dùng')))),

        roleId: user.roleId || user.role?.id,

        position: user.position || '---',

        isActive: user.isActive !== undefined ? user.isActive : true,

        gender: user.gender,

        dateOfBirth: user.dateOfBirth,

        province: user.province,

        district: user.district,

        streetAddress: user.streetAddress,

      }));



      setUsers(mappedUsers);

    } catch (error: unknown) {

      const axiosError = error as AxiosError<{ message?: string }>;

      const msg = axiosError.response?.data?.message || 'Không thể tải danh sách người dùng';

      toast.error(msg);

      setUsers([]);

    } finally {

      setIsLoading(false);

    }

  };



  useEffect(() => {

    fetchUsers();

  }, []);



  const handleToggleStatus = async (user: UserItem) => {

    const newStatus = !user.isActive;

    const currentLoginUser = localStorage.getItem("current_username");

              if (user.username === currentLoginUser) {

      toast.error("Không thể thay đổi trạng thái tài khoản của chính mình");

      return;

    }

    try {

      if (!user.id) {

        toast.error('Thiếu thông tin tài khoản');

        return;

      }



      await api.patch(`/users/profile/${user.id}`, {

        roleId: user.roleId,

        isActive: newStatus,

        email: user.email,

      });



      setUsers((prev) =>

        prev.map((u) =>

          u.id === user.id

            ? { ...u, isActive: newStatus }

            : u

        )

      );



      toast.success(

        newStatus

          ? 'Đã kích hoạt tài khoản!'

          : 'Đã tạm khóa tài khoản!'

      );

      const currentLoginUser = localStorage.getItem('current_username');

      if (user.username === currentLoginUser) {

          toast.error('Không thể thay đổi trạng thái tài khoản của chính mình');

      }

    } catch (error: unknown) {

      const axiosError = error as AxiosError<{ message?: string }>;

      toast.error(

        axiosError.response?.data?.message ??

        'Không thể thay đổi trạng thái người dùng'

      );

    }

  };

const handlePreviewExcel = async (e: React.MouseEvent) => {

    e.preventDefault();

    if (!importFile) {

      toast.error('Vui lòng chọn file Excel trước khi kiểm tra');

      return;

    }



    setIsPreviewing(true);

    try {

      const formData = new FormData();

      formData.append('file', importFile);



      const response = await api.post('/user/import/preview', formData, {

        headers: { 'Content-Type': 'multipart/form-data' },

      });



      const responseData = response.data;

      let rawItems: unknown[] = [];



      if (responseData && responseData.data && Array.isArray(responseData.data.items)) {

        rawItems = responseData.data.items;

      } else if (responseData && Array.isArray(responseData.items)) {

        rawItems = responseData.items;

      } else if (Array.isArray(responseData)) {

        rawItems = responseData;

      }



      if (rawItems.length > 0) {

      const mappedPreview: UserPreviewItem[] = rawItems.map((item, index) => {

        const u = item as any;

        return {

          id: typeof u.id === 'number' ? u.id : index + 1,

          accountId: typeof u.accountId === 'number' ? u.accountId : 0,

          fullName: typeof u.fullName === 'string' ? u.fullName : '---',

          username: typeof u.username === 'string' ? u.username : '---',

          email: typeof u.email === 'string' ? u.email : '---',

          role: (u.role === 'ADMIN' || u.roleCode === 'ADMIN') ? 'Quản trị viên' : ((u.role === 'DOANH_NGHIEP' || u.roleCode === 'DOANH_NGHIEP') ? 'Doanh nghiệp' : (typeof u.roleCode === 'string' ? u.roleCode : (typeof u.role?.name === 'string' ? u.role.name : (typeof u.role === 'string' ? u.role : '---')))),

          position: typeof u.position === 'string' ? u.position : '---',

          isActive: typeof u.isActive === 'boolean' ? u.isActive : true,

          rowNumber: typeof u.rowNumber === 'number' ? u.rowNumber : undefined,

          dateOfBirth: typeof u.dateOfBirth === 'string' ? u.dateOfBirth : '---',

          gender: typeof u.gender === 'string' ? u.gender : '---',

          province: typeof u.province === 'string' ? u.province : '',

          ward: typeof u.ward === 'string' ? u.ward : '',

          address: typeof u.address === 'string' ? u.address : '',

          isValid: typeof u.isValid === 'boolean' ? u.isValid : true,

          errors: Array.isArray(u.errors) ? (u.errors as string[]) : [],

        };

      });



        setPreviewData(mappedPreview);

        toast.success(`Đọc thành công ${mappedPreview.length} dòng dữ liệu xem trước!`);

      } else {

        toast.error('Không tìm thấy danh sách dữ liệu hợp lệ trong file!');

      }

    } catch (error: unknown) {

      const axiosError = error as AxiosError<{ message?: string | string[] }>;

      const backendMessage = axiosError.response?.data?.message;

      toast.error(Array.isArray(backendMessage) ? backendMessage[0] : (backendMessage || 'Không thể đọc file preview'));

    } finally {

      setIsPreviewing(false);

    }

  };

  const validatePassword = (password: string): boolean => {

    if (!password || !password.trim()) {

      setPwdError('Vui lòng nhập mật khẩu mới');

      return false;

    }

    setPwdError('');

    return true;

  };



  const handleSavePassword = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!validatePassword(newPassword)) return;



    try {

      const payload = {

        newPassword: newPassword.trim()          

      };



      const currentUser = users.find(u => u.id === targetResetId);

      const actualAccountId = currentUser?.accountId || currentUser?.id || targetResetId;



      if (!actualAccountId) {

        toast.error('Không tìm thấy tài khoản');

        return;

      }



      await api.patch(

        `/user/${actualAccountId}/reset-password`,

        payload

      );

      const currentLoginUser = localStorage.getItem('current_username');

      if (targetResetUsername === currentLoginUser) {

        toast.success('Bạn vừa đổi mật khẩu của chính mình! Hệ thống tự động đăng xuất...', { duration: 2000 });

        

        setTimeout(() => {

          logout();

          localStorage.removeItem('token');

          localStorage.removeItem('refreshToken');

          localStorage.removeItem('current_username');

          window.location.href = '/login';

        }, 2000);

        return;

      }



      toast.success('Khởi tạo mật khẩu thành công', {

        style: {

          background: '#E2F6E9',

          color: '#2E7D32',

          fontSize: '12px',

          fontWeight: 'bold',

        }

      });

      

      setShowResetPwdModal(false);

      setNewPassword('');

      setPwdError('');

      setShowTextPassword(false);

    } catch (err) {

      const axiosError = err as AxiosError<{ message?: string | string[]; error?: string }>;

      const backendMessage = axiosError.response?.data?.message;

      if (backendMessage) {

        toast.error(Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage);

      } else {

        toast.error('Đặt lại mật khẩu thất bại, vui lòng thử lại');

      }

    }

  };

const handleSingleDelete = async () => {

    const targetId = userToDelete?.id || userToDelete?.accountId;

    if (!userToDelete || !targetId) return;

    if (userToDelete.username === currentLoginUser) {

      toast.error('Không thể xóa tài khoản của chính mình');

      return;

    }

    setIsDeleting(true);

    try {

      await api.delete(`/users/${targetId}`);

      toast.success(`Đã xoá tài khoản cán bộ ${userToDelete.fullName} thành công!`);

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));

      setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));

      setShowDeleteModal(false);

      setUserToDelete(null);

    } catch (err: unknown) {

      const errorObj = err as { response?: { data?: { message?: string | string[] } } };

      const msg = errorObj.response?.data?.message;

      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Xóa tài khoản thất bại'));

    } finally {

      setIsDeleting(false);

    }

  };

const handleBulkDelete = async (e: React.MouseEvent) => {

    e.preventDefault();

    if (selectedUserIds.length === 0) return;

    const isDeletingSelf = users.some(

      u => selectedUserIds.includes(u.id) && u.username === currentLoginUser

    );



    if (isDeletingSelf) {

      toast.error('Không thể xóa tài khoản của chính mình');

      return;

    }

    setIsBatchDeleting(true);

    

    try {

      const targetIds = selectedUserIds

        .map((id) => {

          const u = users.find((item) => item.id === id);

          return String(u?.id || id);

        })

        .filter((id) => Boolean(id));



      await api.patch('/users/delete', { 

        ids: targetIds,

        accountIds: targetIds,

      });

      

      toast.success(`Đã xoá thành công dữ liệu của ${selectedUserIds.length} cán bộ khỏi hệ thống`);

      setUsers(prev => prev.filter(u => !selectedUserIds.includes(u.id)));

      setSelectedUserIds([]);

      setShowBatchDeleteModal(false);

    } catch (err: unknown) {

      const errorObj = err as { response?: { data?: { message?: string | string[] } } };

      const msg = errorObj.response?.data?.message;

      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Xóa hàng loạt thất bại'));

    } finally {

      setIsBatchDeleting(false);

    }

  };



  const filteredUsers = users.filter((user) => {

    if (searchFullName.trim() && !user.fullName?.toLowerCase().includes(searchFullName.toLowerCase().trim())) return false;

    if (searchUsername.trim() && !user.username?.toLowerCase().includes(searchUsername.toLowerCase().trim())) return false;

    if (searchEmail.trim() && !user.email?.toLowerCase().includes(searchEmail.toLowerCase().trim())) return false;

    if (selectedRole && user.role !== selectedRole) return false;

    if (searchPosition.trim() && !user.position?.toLowerCase().includes(searchPosition.toLowerCase().trim())) return false; 

    if (selectedStatus !== '') {

      const isUserActive = selectedStatus === 'ACTIVE';

      if (user.isActive !== isUserActive) return false;

    }

    return true;

  });



  const startIndex = (currentPage - 1) * pageSize;

  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));



  const handleDownloadTemplate = async () => {

    try {

      const response = await api.get('/user/import/template', {

        responseType: 'blob',

      });



      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement('a');

      link.href = url;

      link.download = 'user-import-template.xlsx';

      link.click();

      window.URL.revokeObjectURL(url);

      toast.success('Tải file mẫu thành công');

    } catch {

      toast.error('Không tải được file mẫu từ hệ thống');

    }

  };



  const handleImportExcel = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!importFile) return;



    setIsImporting(true);

    try {

      const formData = new FormData();

      formData.append('file', importFile);



      await api.post('/user/import', formData, {

        headers: {

          'Content-Type': 'multipart/form-data',

        },

      });



      toast.success('Nhập dữ liệu người dùng từ Excel thành công!');

      setShowImportModal(false);

      setImportFile(null);

      setPreviewData([]);

      fetchUsers();

    } catch (error: unknown) {

      const axiosError = error as AxiosError<{ message?: string | string[] }>;

      const backendMessage = axiosError.response?.data?.message;

      toast.error(Array.isArray(backendMessage) ? backendMessage[0] : (backendMessage || 'Import thất bại'));

    } finally {

      setIsImporting(false);

    }

  };



  const handleExportData = () => {

    if (filteredUsers.length === 0) {

      toast.error('Không có dữ liệu để xuất');

      return;

    }

    const headers = ['Họ và tên', 'Tài khoản', 'Email', 'Vai trò', 'Chức danh', 'Trạng thái'];

    const rows = filteredUsers.map((u) => [

      `"${(u.fullName || '').replace(/"/g, '""')}"`,

      `"${(u.username || '').replace(/"/g, '""')}"`,

      `"${(u.email || '').replace(/"/g, '""')}"`,

      `"${(u.role || '').replace(/"/g, '""')}"`,

      `"${(u.position || '').replace(/"/g, '""')}"`,

      `"${u.isActive ? 'Hoạt động' : 'Khóa'}"`,

    ]);



    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download = `Danh_sach_nguoi_dung_${new Date().toISOString().slice(0, 10)}.csv`;

    link.click();

    URL.revokeObjectURL(url);

    toast.success('Xuất dữ liệu người dùng thành công!');

  };



  if (!hasPermission('VIEW_USER')) {
    return (
      <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans p-6 items-center justify-center">
        <div className="p-8 text-center bg-white rounded-xl shadow-xs border border-gray-200 max-w-md w-full">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-800">Không có quyền truy cập</h3>
          <p className="text-xs text-gray-500 mt-1">Tài khoản của bạn không có quyền quản lý danh sách người dùng.</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/companies')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Quay lại trang chính
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">

      

      <div className="bg-white px-6 py-3.5 flex items-center justify-between border-b border-gray-100 flex-shrink-0">

        <h1 className="text-sm font-bold text-gray-800">Danh sách người dùng</h1>

        

        <div className="flex items-center gap-2.5">

          {hasPermission('CREATE_USER') && (
            <button

              type="button"

              onClick={() => setShowImportModal(true)}

              className="px-3.5 py-1.5 border border-[#2F6BFF] hover:bg-blue-50 text-[#2F6BFF] rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 bg-white cursor-pointer"

            >

              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />

              </svg>

              Import

            </button>
          )}

          {hasPermission('CREATE_USER') && (
            <button

              type="button"

              onClick={() => router.push('/dashboard/users/create')}

              className="px-3.5 py-1.5 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"

            >

              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v16m7.5-8h-16" />

              </svg>

              Thêm mới

            </button>
          )}

        </div>

      </div>



      <div className="p-6 space-y-4">

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full border-collapse text-left text-xs">

              <thead>

                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-normal text-[10px]">

                  <th className="py-3 px-3 text-center w-10">

                    <div className="flex items-center justify-center">

                      <input

                        type="checkbox"

                        checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.includes(u.id))}

                        onChange={(e) => {

                          if (e.target.checked) {

                            setSelectedUserIds(paginatedUsers.map(u => u.id));

                          } else {

                            setSelectedUserIds([]);

                          }

                        }}

                        disabled={!hasPermission('DELETE_USER')}
                        className="w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

                      />

                    </div>

                  </th>

                  <th className="py-3 px-1 text-center w-14"></th>

                  <th className="py-3 px-3">Họ và tên</th>

                  <th className="py-3 px-3">Tài khoản</th>

                  <th className="py-3 px-3">Email</th>

                  <th className="py-3 px-3 w-40">Vai trò</th>

                  <th className="py-3 px-3 w-40">Chức danh</th>

                  <th className="py-3 px-3 w-28 text-center">Trạng thái</th>

                </tr>

                

                <tr className="bg-gray-50/50 border-b border-gray-100">

                  <th className="py-2 px-3 text-center"></th>

                  <th className="py-2 px-1 text-center"></th>

                  <th className="py-2 px-3">

                    <input

                      type="text"

                      value={searchFullName}

                      onChange={(e) => setSearchFullName(e.target.value)}

                      placeholder="Tìm họ tên..."

                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-[11px] font-normal text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"

                    />

                  </th>

                  <th className="py-2 px-3">

                    <input

                      type="text"

                      value={searchUsername}

                      onChange={(e) => setSearchUsername(e.target.value)}

                      placeholder="Tìm tài khoản..."

                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-[11px] font-normal text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"

                    />

                  </th>

                  <th className="py-2 px-3">

                    <input

                      type="text"

                      value={searchEmail}

                      onChange={(e) => setSearchEmail(e.target.value)}

                      placeholder="Tìm email..."

                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-[11px] font-normal text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"

                    />

                  </th>

                  <th className="py-2 px-3">

                    <div className="relative">

                      <select

                        value={selectedRole}

                        onChange={(e) => setSelectedRole(e.target.value)}

                        className="w-full appearance-none px-2.5 py-1.5 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"

                      >

                        <option value="">Vai trò</option>

                        <option value="Quản trị viên">Quản trị viên</option>

                        <option value="Lãnh đạo">Lãnh đạo</option>

                        <option value="Chuyên viên">Chuyên viên</option>

                      </select>

                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[9px]">

                        ▼

                      </span>

                    </div>

                  </th>

                  <th className="py-2 px-3">

                    <input

                      type="text"

                      value={searchPosition}

                      onChange={(e) => setSearchPosition(e.target.value)}

                      placeholder="Tìm chức danh..."

                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-[11px] font-normal text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"

                    />

                  </th>

                  <th className="py-2 px-3 text-center">

                    <div className="relative">

                      <select

                        value={selectedStatus}

                        onChange={(e) => setSelectedStatus(e.target.value)}

                        className="w-full appearance-none px-2 py-1.5 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer text-center"

                      >

                        <option value="">Trạng thái</option>

                        <option value="ACTIVE">Hoạt động</option>

                        <option value="INACTIVE">Khóa</option>

                      </select>

                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[9px]">

                        ▼

                      </span>

                    </div>

                  </th>

                </tr>

              </thead>

              

              <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">

                {isLoading ? (

                  <tr>

                    <td colSpan={colSpanCount} className="py-8 text-center text-gray-400 font-medium animate-pulse">

                      Đang tải danh sách người dùng từ database thực tế...

                    </td>

                  </tr>

                ) : paginatedUsers.length === 0 ? (

                  <tr>

                    <td colSpan={colSpanCount} className="py-8 text-center text-gray-400 font-medium">

                      Không tìm thấy người dùng nào phù hợp.

                    </td>

                  </tr>

                ) : (

                  paginatedUsers.map((user) => {

                    const isCurrentUser = user.username === currentLoginUser;



                    return (

                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">

                        <td className="py-2.5 px-3 text-center">

                          <input

                            type="checkbox"

                            disabled={!hasPermission('DELETE_USER') || user.username === currentLoginUser}

                            checked={selectedUserIds.includes(user.id)}

                            onChange={(e) => {

                              if (e.target.checked) {

                                setSelectedUserIds((prev) => [...prev, user.id]);

                              } else {

                                setSelectedUserIds((prev) => prev.filter((id) => id !== user.id));

                              }

                            }}

                            className="w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

                          />

                        </td>

                        <td className="py-2.5 px-1 text-center">

                          <div className="flex items-center justify-center gap-2">

                            <button

                              type="button"

                              onClick={() => {

                                const actualAccountId = user.accountId ?? user.id;

                                router.push(`/dashboard/users/edit/${actualAccountId}`);

                              }}

                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"

                              title="Chỉnh sửa người dùng"

                            >

                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />

                              </svg>

                            </button>

                            {hasPermission('RESET_PWD_USER') && (
                            <button

                              type="button"

                              onClick={() => {

                                setTargetResetId(user.id);

                                setTargetResetUsername(user.username);

                                setShowResetPwdModal(true);

                              }}

                              className="p-1 text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"

                              title="Khởi tạo mật khẩu"

                            >

                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />

                              </svg>

                            </button>
                            )}

                            {hasPermission('DELETE_USER') && (
                            <button

                              type="button"

                              disabled={isCurrentUser}

                              onClick={() => {

                                setUserToDelete(user);

                                setShowDeleteModal(true);

                              }}

                              className={`p-1 transition-colors cursor-pointer ${

                                isCurrentUser ? 'opacity-30 cursor-not-allowed text-gray-300' : 'text-gray-400 hover:text-red-600'

                              }`}

                              title={isCurrentUser ? 'Không thể xóa tài khoản của chính mình' : 'Xóa người dùng'}

                            >

                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                              </svg>

                            </button>
                            )}

                          </div>

                        </td>

                        <td className="py-2.5 px-3 font-semibold text-gray-800">{user.fullName || '---'}</td>

                        <td className="py-2.5 px-3 font-mono text-gray-600">{user.username}</td>

                        <td className="py-2.5 px-3 text-gray-500">{user.email}</td>

                        <td className="py-2.5 px-3 text-gray-500">{user.role || '---'}</td>

                        <td className="py-2.5 px-3 text-gray-500">{user.position || '---'}</td>

                        <td className="py-2.5 px-3 text-center">

                          <div className="flex items-center justify-center">

                            <button

                              type="button"

                              disabled={isCurrentUser}

                              onClick={() => handleToggleStatus(user)}

                              className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${

                                isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

                              } ${user.isActive ? 'bg-[#2F6BFF] justify-end' : 'bg-gray-300 justify-start'}`}

                              title="Thay đổi trạng thái tài khoản"

                            >

                              <span className="bg-white w-3.5 h-3.5 rounded-full shadow-sm" />

                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  })

                )}

              </tbody>

            </table>

          </div>



          <div className="px-6 py-3.5 flex items-center justify-between border-t border-gray-100 bg-white text-xs text-gray-500">

            <button

              type="button"

              onClick={handleExportData}

              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"

            >

              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />

              </svg>

              Export Data

            </button>



            <div className="flex items-center gap-4 text-xs text-gray-600 font-medium select-none">

              <div className="relative">

                <select

                  value={pageSize}

                  onChange={(e) => {

                    setPageSize(Number(e.target.value));

                    setCurrentPage(1);

                  }}

                  className="appearance-none pl-2.5 pr-6 py-1 border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer font-normal text-xs"

                >

                  <option value={10}>10</option>

                  <option value={20}>20</option>

                  <option value={50}>50</option>

                </select>

                <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">

                  ▼

                </span>

              </div>



              <span>

                {filteredUsers.length === 0

                  ? '0 - 0 of 0'

                  : `${startIndex + 1} - ${Math.min(startIndex + pageSize, filteredUsers.length)} of ${filteredUsers.length}`}

              </span>



              <div className="flex items-center gap-1">

                <button

                  type="button"

                  disabled={currentPage === 1}

                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}

                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 cursor-pointer"

                  title="Trang trước"

                >

                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />

                  </svg>

                </button>



                <button

                  type="button"

                  disabled={currentPage >= totalPages || filteredUsers.length === 0}

                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}

                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 cursor-pointer"

                  title="Trang sau"

                >

                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />

                  </svg>

                </button>

              </div>

            </div>

          </div>



        </div>

      </div>



      {selectedUserIds.length > 0 && (

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center overflow-hidden animate-slideUp z-50 text-xs font-medium">

          <div className="bg-[#2F6BFF] text-white px-4 py-3 font-bold flex items-center justify-center min-w-[40px]">{selectedUserIds.length}</div>

          <div className="text-gray-700 px-5 py-3 select-none">dữ liệu được chọn</div>

          <div className="px-2 flex items-center">

          <button 

            type="button" 

            onClick={() => setShowBatchDeleteModal(true)}

            className="bg-[#FF3B30] hover:bg-[#E03026] text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-sm text-[11px]"

          >

          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

          </svg>

            Xoá

          </button>          

          </div>

          <div className="h-6 w-px bg-gray-200 my-auto ml-2" />

          <button type="button" onClick={() => setSelectedUserIds([])} className="p-3 text-gray-400 hover:text-gray-600 transition-colors text-sm font-bold flex items-center justify-center h-full cursor-pointer">✕</button>

        </div>

      )}



      {showResetPwdModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-xs animate-fadeIn">

          <div className="bg-white rounded-lg w-full max-w-[400px] shadow-2xl overflow-hidden animate-scaleUp">

            <div className="bg-[#2F6BFF] text-white px-5 py-2.5 font-bold text-center text-xs tracking-wide select-none">Xác nhận</div>

            <form onSubmit={handleSavePassword} className="p-5 space-y-4 text-xs">

              <div className="text-gray-700 font-medium select-none">Khởi tạo mật khẩu cho tài khoản <span className="font-bold text-gray-900">{targetResetUsername}</span></div>

              <div className="relative mt-1">

                <input

                  type={showTextPassword ? "text" : "password"}

                  value={newPassword}

                  onChange={(e) => {

                    setNewPassword(e.target.value);

                    if (pwdError) setPwdError('');

                  }}

                  placeholder="Nhập mật khẩu mới mong muốn"

                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-gray-800 placeholder-gray-400 text-xs shadow-inner"

                  autoFocus

                />

                <button

                  type="button"

                  onClick={() => setShowTextPassword(!showTextPassword)}

                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"

                >

                  {showTextPassword ? (

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />

                    </svg>

                  ) : (

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />

                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />

                    </svg>

                  )}

                </button>

              </div>



              {pwdError && (

                <div className="text-red-500 font-semibold bg-red-50 p-2 rounded border border-red-100 leading-relaxed text-[11px] animate-fadeIn"> {pwdError}</div>

              )}



              <div className="flex items-center justify-end gap-3 pt-2">

                <button type="button" onClick={() => { setShowResetPwdModal(false); setNewPassword(''); setPwdError(''); }} className="text-blue-600 hover:underline font-bold px-1 py-1.5 transition-colors cursor-pointer">Huỷ bỏ</button>

                <button type="submit" className="bg-[#2F6BFF] hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer">

                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />

                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8" />

                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8" />

                  </svg>

                  Lưu

                </button>

              </div>

            </form>

          </div>

        </div>

      )}



{showImportModal && (

  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-xs animate-fadeIn">

    <div className={`bg-white rounded-2xl w-full max-h-full flex flex-col shadow-2xl overflow-hidden text-gray-700 transition-all duration-300 ${

      previewData.length > 0 ? 'max-w-6xl' : 'max-w-[440px]'

    }`}>

      

      <div className="bg-[#2F6BFF] text-white text-center py-4 font-bold text-sm uppercase tracking-wider select-none flex-shrink-0">

        {previewData.length > 0 ? 'Xem trước danh sách dữ liệu sắp nhập' : 'Nhập người dùng từ Excel'}

      </div>



      <form onSubmit={handleImportExcel} className="p-6 flex-1 overflow-y-auto space-y-5 text-xs flex flex-col min-h-0">

        

        {previewData.length === 0 && (

          <div className="text-xs space-y-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-gray-600 leading-relaxed select-none flex-shrink-0">

            <p className="font-semibold text-emerald-800">Hướng dẫn nhập dữ liệu:</p>

            <p>1. Tải về file mẫu Excel bên dưới.</p>

            <p>2. Điền thông tin người dùng theo đúng các cột trong file mẫu.</p>

            <p>3. Chọn file, bấm "Kiểm tra dữ liệu", kiểm tra bảng rồi mới "Nhập dữ liệu".</p>

            <button

              type="button"

              onClick={handleDownloadTemplate}

              className="mt-2 text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"

            >

              Tải xuống file Excel mẫu

            </button>

          </div>

        )}



        {previewData.length > 0 && (

          <div className="space-y-2 flex-1 flex flex-col min-h-0 min-w-0">

            <span className="text-[11px] font-bold text-gray-700 block select-none flex-shrink-0">

              Bảng đối soát thông tin tài liệu đọc được từ file:

            </span>

            

            <div className="border border-gray-200 rounded-xl overflow-y-auto overflow-x-auto shadow-inner bg-gray-50/50 max-h-[320px] flex-1">

              <table className="w-full text-left border-collapse text-[10.5px] min-w-[1200px] table-auto">

                <thead className="sticky top-0 bg-gray-100 font-bold text-gray-600 shadow-xs border-b border-gray-200 z-10 select-none">

                  <tr>

                    <th className="py-2 px-2 text-center w-14">Hợp lệ</th>

                    <th className="py-2 px-2 w-28">Tài khoản</th>

                    <th className="py-2 px-2 w-28">Họ và tên</th>

                    <th className="py-2 px-2 w-24">Ngày sinh</th>

                    <th className="py-2 px-2 w-20">Giới tính</th>

                    <th className="py-2 px-2 w-35">Email</th>

                    <th className="py-2 px-2 w-20">Vai trò</th>

                    <th className="py-2 px-2 w-24">Chức danh</th>

                    <th className="py-2 px-2 w-60">Địa chỉ cụ thể</th>

                    <th className="py-2 px-2 w-50">Lỗi chi tiết</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200 text-gray-600 bg-white">

                  {previewData.map((pUser, index) => (

                    <tr 

                      key={pUser.id || index} 

                      className={`hover:bg-gray-50/60 ${!pUser.isValid ? 'bg-red-50/40 hover:bg-red-50/60' : ''}`}

                    >

                      <td className="py-2 px-2 text-center text-sm">

                        {pUser.isValid ? (

                          <span className="text-green-600 font-bold">✓</span>

                        ) : (

                          <span className="text-red-500 font-bold">✕</span>

                        )}

                      </td>

                      <td className="py-2 px-2 font-mono font-semibold text-gray-800 truncate" title={pUser.username}>{pUser.username}</td>

                      <td className="py-2 px-2 font-medium text-gray-900 truncate" title={pUser.fullName}>{pUser.fullName}</td>

                      <td className="py-2 px-2">{pUser.dateOfBirth || '---'}</td>

                      <td className="py-2 px-2">{pUser.gender || '---'}</td>

                      <td className="py-2 px-2 truncate" title={pUser.email}>{pUser.email}</td>

                      <td className="py-2 px-2 font-semibold text-blue-600 truncate" title={pUser.role}>{pUser.role}</td>

                      <td className="py-2 px-2 text-gray-500 truncate" title={pUser.position}>{pUser.position}</td>

                      <td className="py-2 px-2 truncate" title={`${pUser.address || ''} ${pUser.ward || ''} ${pUser.province || ''}`.trim()}>

                        {pUser.address || pUser.ward || pUser.province 

                          ? `${pUser.address ? pUser.address + ', ' : ''}${pUser.ward ? pUser.ward + ', ' : ''}${pUser.province || ''}`

                          : '---'}

                      </td>

                      <td className="py-2 px-2 text-red-500 font-medium truncate" title={pUser.errors?.join('; ')}>

                        {pUser.errors && pUser.errors.length > 0 

                          ? pUser.errors.join('; ') 

                          : (pUser.isValid ? <span className="text-green-600 text-[10px]">Sẵn sàng</span> : 'Sai định dạng')}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}



        <div className="space-y-2 flex-shrink-0">

          <span className="text-[10.5px] font-semibold text-gray-400 block select-none">File Excel được chọn <span className="text-red-500">*</span></span>

          <div className="flex items-center gap-3">

            <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors bg-white shadow-xs">

              {previewData.length > 0 ? 'Thay đổi file' : 'Chọn file'}

              <input

                type="file"

                onChange={(e) => {

                  setImportFile(e.target.files?.[0] || null);

                  setPreviewData([]);

                }}

                accept=".xlsx, .xls"

                className="hidden"

              />

            </label>

            {importFile && (

              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 text-xs">

                <span className="text-gray-700 font-medium truncate max-w-[200px]" title={importFile.name}>{importFile.name}</span>

                <button type="button" onClick={() => { setImportFile(null); setPreviewData([]); }} className="text-red-500 hover:text-red-700 font-bold px-1 hover:bg-gray-200/60 rounded transition-colors cursor-pointer">✕</button>

              </div>

            )}

            

            {importFile && previewData.length === 0 && (

              <button

                type="button"

                disabled={isPreviewing}

                onClick={handlePreviewExcel}

                className="px-3 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"

              >

                {isPreviewing ? 'Đang kiểm tra...' : 'Kiểm tra dữ liệu'}

              </button>

            )}

          </div>

        </div>



        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 flex-shrink-0">

          <button

            type="button"

            onClick={() => {

              setShowImportModal(false);

              setImportFile(null);

              setPreviewData([]);

            }}

            className="text-blue-600 hover:underline font-bold px-1 py-1.5 transition-colors cursor-pointer"

          >

            Huỷ bỏ

          </button>

          <button

            type="submit"

            disabled={isImporting || !importFile || previewData.length === 0}

            className="bg-[#2F6BFF] hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"

          >

            {isImporting ? 'Đang nhập...' : 'Nhập dữ liệu chính thức'}

          </button>

        </div>



      </form>

    </div>

  </div>

)}

      {showDeleteModal && userToDelete && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-xs animate-fadeIn">

          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-scaleUp text-gray-700">

            <div className="p-6 text-center space-y-4">

              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">

                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />

                </svg>

              </div>



              <div className="space-y-2">

                <h3 className="text-sm font-bold text-gray-900">Xác nhận xóa tài khoản</h3>

                <div className="text-[11px] space-y-1 bg-red-50/50 p-3 rounded-lg border border-red-100 text-gray-600 leading-relaxed text-left">

                  <div>Cán bộ: <span className="font-bold text-gray-800">{userToDelete.fullName}</span></div>

                  <div>Tài khoản: <span className="font-mono font-semibold text-gray-800">{userToDelete.username}</span></div>

                  <div>Chức danh: <span className="text-gray-700">{userToDelete.position}</span></div>

                </div>

                <p className="text-[11px] text-gray-400 leading-normal">

                  Bạn có chắc chắn muốn xóa tài khoản này? Hành động này sẽ thực hiện xóa mềm, đưa tài khoản vào danh sách tài khoản lưu trữ và tạm ngừng quyền truy cập hệ thống của tài khoản này.

                </p>

              </div>



              <div className="flex items-center justify-center gap-3 pt-2">

                <button

                  type="button"

                  onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}

                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 cursor-pointer bg-white"

                >

                  Huỷ bỏ

                </button>

                <button

                  type="button"

                  onClick={handleSingleDelete}

                  disabled={isDeleting}

                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-red-400 cursor-pointer"

                >

                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



      {showBatchDeleteModal && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-xs animate-fadeIn">

          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-scaleUp text-gray-700">

            <div className="p-6 text-center space-y-4">

              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">

                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />

                </svg>

              </div>



              <div className="space-y-2">

                <h3 className="text-sm font-bold text-gray-900">Xác nhận xóa hàng loạt</h3>

                <p className="text-xs text-gray-500 leading-normal">

                  Bạn có chắc chắn muốn xóa <span className="font-bold text-red-600">{selectedUserIds.length}</span> tài khoản cán bộ đã chọn? Toàn bộ các tài khoản này sẽ được chuyển vào mục lưu trữ tạm thời.

                </p>

              </div>



              <div className="flex items-center justify-center gap-3 pt-2">

                <button

                  type="button"

                  onClick={() => setShowBatchDeleteModal(false)}

                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 cursor-pointer bg-white"

                >

                  Huỷ bỏ

                </button>

                <button

                  type="button"

                  onClick={(e) => handleBulkDelete(e)}

                  disabled={isBatchDeleting}

                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-red-400 cursor-pointer"

                >

                  {isBatchDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};