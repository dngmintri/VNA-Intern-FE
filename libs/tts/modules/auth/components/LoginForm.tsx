'use client';

import React from 'react';
import { useLogin } from '../hooks/useLogin';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export const LoginForm = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    errors,
    showPassword,
    togglePasswordVisibility,
    isLoading,
  } = useLogin();

  return (
    <div className="w-full max-w-lg mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-100">  
        <div className="flex justify-center mb-6">
        <div className="w-20 h-20 relative drop-shadow-md">
            <Image
            src="/quochuy.png"
            alt="Quốc huy Việt Nam"
            fill 
            priority 
            className="object-contain" 
            />
        </div>
      </div>

      <h2 className="text-lg font-bold text-center text-gray-800 uppercase mb-6 leading-snug">
        Phần Mềm Quản Lý - Tạo Lập Cơ Sở Dữ Liệu <br /> An Toàn Vệ Sinh Lao Động
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-blue-600 font-bold text-sm tracking-wider mb-2 border-b pb-1 inline-block">
          ĐĂNG NHẬP
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Tên tài khoản *
          </label>
          <input
            {...register('username')}
            type="text"
            placeholder="nguyenvana"
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400 transition-all ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Mật khẩu *
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400 pr-10 transition-all ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
            >
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
            <input
              {...register('rememberMe')}
              type="checkbox"
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 transition-colors"
            />
            Nhớ đăng nhập
          </label>
          <a href="/forgot-password" className="text-blue-600 hover:underline">
            Quên mật khẩu
          </a>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/register')}
            className="w-full py-2.5 bg-white hover:bg-gray-50 text-[#2F6BFF] border border-[#2F6BFF] rounded-lg font-medium text-sm transition-colors"
          >
            Đăng ký tài khoản doanh nghiệp
          </button>
        </div>
      </form>
    </div>
  );
};