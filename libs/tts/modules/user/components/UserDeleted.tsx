'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface UserDeletedProps {
  onBack?: () => void;
}

export const UserDeleted: React.FC<UserDeletedProps> = ({ onBack }) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/dashboard/users');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Hệ thống</span>
          <span className="text-xs text-gray-400">❯</span>
          <button
            type="button"
            onClick={handleBack}
            className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            Quản lý người dùng
          </button>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-800">Danh sách tài khoản đã xóa</h1>
        </div>

        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
        >
          ❮ Quay lại danh sách
        </button>
      </div>

      <div className="p-8 flex flex-col items-center justify-center flex-1 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-200 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-gray-800 mb-2">Chức năng chưa được Backend hỗ trợ</h2>
        <p className="text-xs text-gray-500 max-w-md leading-relaxed mb-6">
          Hệ thống Backend hiện tại chưa triển khai cơ chế Soft Delete (xóa mềm/thùng rác) và endpoint truy xuất danh sách người dùng đã xóa.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Trở về danh sách người dùng
        </button>
      </div>
    </div>
  );
};

export default UserDeleted;

