'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/libs/core/api/axios';
import { AxiosError } from 'axios';
import { UserItem, BackendUserListResponse } from '../interfaces/user.interface';
import { useHasPermission } from '@/libs/shared/hooks/useHasPermission';

export interface UserDeletedProps {
  onBack?: () => void;
}

const formatDisplayDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  let normalized = dateStr;
  if (normalized.includes('T')) {
    normalized = normalized.split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split('-');
    return `${day}/${month}/${year}`;
  }
  const sep = normalized.includes('/') ? '/' : '-';
  const parts = normalized.split(sep);
  if (parts.length === 3) {
    const [first, second, third] = parts;
    if (first.length === 4) {
      return `${third}/${second}/${first}`;
    } else {
      return `${first}/${second}/${third}`;
    }
  }
  return normalized;
};

export const UserDeleted: React.FC<UserDeletedProps> = ({ onBack }) => {
  const router = useRouter();
  const { hasPermission } = useHasPermission();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchFullName, setSearchFullName] = useState<string>('');
  const [searchUsername, setSearchUsername] = useState<string>('');
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modals - Batch Restore
  const [showBatchRestoreModal, setShowBatchRestoreModal] = useState<boolean>(false);
  const [isRestoringBatch, setIsRestoringBatch] = useState<boolean>(false);

  // Modals - Batch Permanent Delete
  const [showBatchPermanentModal, setShowBatchPermanentModal] = useState<boolean>(false);
  const [isDeletingPermanentBatch, setIsDeletingPermanentBatch] = useState<boolean>(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/dashboard/users');
    }
  };

  const fetchDeletedUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<BackendUserListResponse>('/users/deleted');
      const responseData = res.data;
      const rawList = responseData?.data?.items || responseData?.items || (Array.isArray(responseData) ? responseData : []);

      const mapped: UserItem[] = (Array.isArray(rawList) ? rawList : []).map((u: any) => ({
        id: String(u.id),
        username: u.username,
        email: u.email,
        fullName: u.fullName || '—',
        avatar: u.avatar || null,
        role: typeof u.role === 'object' ? u.role?.name || u.role?.code : u.role,
        position: u.position || '—',
        gender: u.gender,
        dateOfBirth: u.dateOfBirth,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));

      // Lọc các user nội bộ (bỏ doanh nghiệp)
      const internalDeleted = mapped.filter((u) => {
        const r = String(u.role || '').toUpperCase();
        return r !== 'DOANH_NGHIEP';
      });

      setUsers(internalDeleted);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Không thể tải danh sách tài khoản đã xóa';
      toast.error(msg);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedUserIds([]);
  }, [searchFullName, searchUsername, searchEmail, selectedRole]);

  // Client-side filtering
  const filteredUsers = users.filter((u) => {
    if (searchFullName.trim()) {
      const match = u.fullName.toLowerCase().includes(searchFullName.trim().toLowerCase());
      if (!match) return false;
    }
    if (searchUsername.trim()) {
      const match = u.username.toLowerCase().includes(searchUsername.trim().toLowerCase());
      if (!match) return false;
    }
    if (searchEmail.trim()) {
      const match = u.email.toLowerCase().includes(searchEmail.trim().toLowerCase());
      if (!match) return false;
    }
    if (selectedRole) {
      const r = String(u.role || '').toUpperCase();
      if (r !== selectedRole.toUpperCase()) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const executeBatchRestore = async () => {
    if (selectedUserIds.length === 0) return;
    setIsRestoringBatch(true);
    const toastId = toast.loading(`Đang khôi phục ${selectedUserIds.length} tài khoản...`);
    try {
      await api.patch('/users/restore-batch', { ids: selectedUserIds });
      toast.success(`Khôi phục thành công ${selectedUserIds.length} tài khoản!`, { id: toastId });
      setShowBatchRestoreModal(false);
      setSelectedUserIds([]);
      fetchDeletedUsers();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Khôi phục hàng loạt thất bại';
      toast.error(msg, { id: toastId });
    } finally {
      setIsRestoringBatch(false);
    }
  };

  const executeBatchPermanentDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setIsDeletingPermanentBatch(true);
    const toastId = toast.loading(`Đang xóa vĩnh viễn ${selectedUserIds.length} tài khoản...`);
    try {
      await api.delete('/users/permanent-batch', {
        data: { ids: selectedUserIds },
      });
      toast.success(`Đã xóa vĩnh viễn ${selectedUserIds.length} tài khoản khỏi cơ sở dữ liệu!`, { id: toastId });
      setShowBatchPermanentModal(false);
      setSelectedUserIds([]);
      fetchDeletedUsers();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Xóa vĩnh viễn hàng loạt thất bại';
      toast.error(msg, { id: toastId });
    } finally {
      setIsDeletingPermanentBatch(false);
    }
  };

  const getRoleBadge = (roleName?: string) => {
    const r = String(roleName || '').toUpperCase();
    switch (r) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Quản trị viên
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Quản lý
          </span>
        );
      case 'EMPLOYEE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            Chuyên viên
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {roleName || '—'}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      {/* Top Header Bar */}
      <div className="bg-white px-6 py-3.5 flex items-center justify-between border-b border-gray-200 shadow-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Hệ thống</span>
          <span className="text-xs text-gray-400">❯</span>
          <button
            type="button"
            onClick={handleBack}
            className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            Quản lý người dùng
          </button>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>Tài khoản đã xóa</span>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-50 text-red-600 border border-red-200">
              {filteredUsers.length}
            </span>
          </h1>
        </div>

        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 bg-white cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại danh sách
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex-1 flex flex-col justify-between">
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold text-xs">
                  <th className="py-3 px-3 text-center w-10">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.includes(String(u.id)))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds(paginatedUsers.map((u) => String(u.id)));
                          } else {
                            setSelectedUserIds([]);
                          }
                        }}
                        disabled={!hasPermission('DELETE_USER')}
                        className="w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                      />
                    </div>
                  </th>
                  <th className="py-3 px-3 min-w-[180px] font-medium">Họ và tên</th>
                  <th className="py-3 px-3 min-w-[140px] font-medium">Tên đăng nhập</th>
                  <th className="py-3 px-3 min-w-[180px] font-medium">Email</th>
                  <th className="py-3 px-3 min-w-[130px] font-medium">Vai trò</th>
                  <th className="py-3 px-3 min-w-[140px] font-medium">Chức vụ</th>
                  <th className="py-3 px-3 w-32 font-medium">Ngày xóa</th>
                </tr>

                {/* Filter Row */}
                <tr className="bg-white border-b border-gray-100">
                  <th className="py-2 px-3"></th>
                  <th className="py-2 px-3 font-normal">
                    <input
                      type="text"
                      placeholder="Lọc họ tên..."
                      value={searchFullName}
                      onChange={(e) => setSearchFullName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-normal text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>
                  <th className="py-2 px-3 font-normal">
                    <input
                      type="text"
                      placeholder="Lọc tên đăng nhập..."
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-normal text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>
                  <th className="py-2 px-3 font-normal">
                    <input
                      type="text"
                      placeholder="Lọc email..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-normal text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>
                  <th className="py-2 px-3 font-normal">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-normal text-gray-600 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Tất cả vai trò</option>
                      <option value="ADMIN">Quản trị viên</option>
                      <option value="MANAGER">Quản lý</option>
                      <option value="EMPLOYEE">Chuyên viên</option>
                    </select>
                  </th>
                  <th className="py-2 px-3" colSpan={2}></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-400 font-medium">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải danh sách tài khoản đã xóa...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 font-semibold">
                      Không tìm thấy tài khoản nào đã xóa
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={String(user.id)} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(String(user.id))}
                            onChange={(e) => {
                              const uid = String(user.id);
                              if (e.target.checked) {
                                setSelectedUserIds((prev) => [...prev, uid]);
                              } else {
                                setSelectedUserIds((prev) => prev.filter((id) => id !== uid));
                              }
                            }}
                            disabled={!hasPermission('DELETE_USER')}
                            className="w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-gray-800">
                        {user.fullName || '—'}
                      </td>

                      <td className="py-3 px-3 font-semibold text-gray-800">
                        {user.username}
                      </td>

                      <td className="py-3 px-3 text-gray-600 truncate max-w-[180px]" title={user.email}>
                        {user.email || '—'}
                      </td>

                      <td className="py-3 px-3">
                        {getRoleBadge(user.role)}
                      </td>

                      <td className="py-3 px-3 text-gray-600 truncate max-w-[150px]" title={user.position || ''}>
                        {user.position || '—'}
                      </td>

                      <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                        {formatDisplayDate(user.updatedAt || user.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>dòng mỗi trang</span>
            </div>

            <div className="text-gray-500 font-medium">
              Hiển thị {filteredUsers.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, filteredUsers.length)} của {filteredUsers.length} tài khoản
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 bg-white shadow-xs font-semibold cursor-pointer"
              >
                ❮ Trước
              </button>
              
              <span className="font-semibold text-gray-700">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 bg-white shadow-xs font-semibold cursor-pointer"
              >
                Sau ❯
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar at Top when selecting 1+ users (shifted right to balance with sidebar and avoid overlapping breadcrumb) */}
      {selectedUserIds.length > 0 && (
        <div className="fixed top-3 left-[calc(50%+130px)] -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center h-8 overflow-hidden z-50 animate-fadeIn text-xs">
          <div className="bg-[#2F6BFF] text-white px-2.5 h-full flex items-center justify-center font-bold text-xs">
            {selectedUserIds.length}
          </div>
          
          <div className="px-3 text-gray-700 font-medium whitespace-nowrap text-xs">
            tài khoản được chọn
          </div>
          
          <button
            type="button"
            disabled={isRestoringBatch || !hasPermission('DELETE_USER')}
            onClick={() => setShowBatchRestoreModal(true)}
            className="bg-[#34C759] hover:bg-[#2EB04F] disabled:opacity-50 text-white rounded h-6 px-2.5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer mr-2 shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Khôi phục
          </button>

          <button
            type="button"
            disabled={isDeletingPermanentBatch || !hasPermission('DELETE_USER')}
            onClick={() => setShowBatchPermanentModal(true)}
            className="bg-[#E53935] hover:bg-[#D32F2F] disabled:opacity-50 text-white rounded h-6 px-2.5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer mr-2 shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Xóa vĩnh viễn
          </button>

          <button
            type="button"
            onClick={() => setSelectedUserIds([])}
            className="text-gray-400 hover:text-gray-600 transition-colors px-2 h-full cursor-pointer flex items-center justify-center border-l border-gray-100 hover:bg-gray-50"
            title="Bỏ chọn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Modal Batch Restore */}
      {showBatchRestoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900">Khôi phục tài khoản</h3>
              <p className="text-xs text-gray-600 leading-normal">
                Bạn có chắc chắn muốn khôi phục <span className="font-bold text-emerald-600">{selectedUserIds.length}</span> tài khoản đã chọn? Các tài khoản này sẽ được mở lại hoạt động bình thường.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchRestoreModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={executeBatchRestore}
                disabled={isRestoringBatch}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:bg-emerald-400 cursor-pointer"
              >
                {isRestoringBatch ? 'Đang khôi phục...' : 'Xác nhận khôi phục'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Batch Permanent Delete */}
      {showBatchPermanentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-red-600">CẢNH BÁO XÓA VĨNH VIỄN HÀNG LOẠT</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                Bạn đang chuẩn bị xóa vĩnh viễn <span className="font-bold text-red-600">{selectedUserIds.length}</span> tài khoản khỏi cơ sở dữ liệu.
              </p>
              <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 text-[11px] text-red-700 font-semibold text-center">
                Dữ liệu sau khi xóa sẽ KHÔNG THỂ KHÔI PHỤC!
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchPermanentModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={executeBatchPermanentDelete}
                disabled={isDeletingPermanentBatch}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:bg-red-400 cursor-pointer"
              >
                {isDeletingPermanentBatch ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDeleted;
