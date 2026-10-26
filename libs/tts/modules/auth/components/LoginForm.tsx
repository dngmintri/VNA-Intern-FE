'use client';

import React from 'react';
import { useLogin } from '../hooks/useLogin';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const EyeIcon = () => (
  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-blue-600 font-bold text-sm tracking-wider mb-1 border-b-2 border-blue-600 pb-1 inline-block">
          ĐĂNG NHẬP
        </div>

        <div className="relative mt-2">
          <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-500 z-10 select-none">
            Tên tài khoản *
          </label>
          <input
            {...register('username')}
            type="text"
            placeholder="nguyenvana"
            className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400 transition-all ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        <div className="relative mt-2">
          <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-500 z-10 select-none">
            Mật khẩu *
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400 pr-10 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
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
            className="w-full py-3 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/register')}
            className="w-full py-2.5 bg-white hover:bg-gray-50 text-[#2F6BFF] border border-[#2F6BFF] rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            Đăng ký tài khoản doanh nghiệp
          </button>
        </div>
      </form>
    </div>
  );
};
