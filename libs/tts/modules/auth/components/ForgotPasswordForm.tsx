'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { forgotPasswordApi, resetPasswordApi } from '../api/auth.api';
import { AxiosError } from 'axios';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (value: string): string | null => {
  if (!value.trim()) return 'Vui lòng nhập email';
  if (!EMAIL_REGEX.test(value))
    return 'Vui lòng nhập đúng định dạng email, Định dạng đúng ... @...';
  return null;
};

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

export const ForgotPasswordForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateEmail(email);
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);

    try {
      await forgotPasswordApi({ email });
      toast.success('Gửi email thành công');
      setStep(2);
      setTimer(60);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const msg = axiosError.response?.data?.message;
      const rawMsg = Array.isArray(msg) ? msg[0] : msg || '';

      if (
        axiosError.response?.status === 404 ||
        axiosError.response?.status === 400 ||
        rawMsg.includes('không tồn tại') ||
        rawMsg.includes('chưa đăng ký')
      ) {
        toast.error('Email chưa đăng ký trong hệ thống. Xin vui lòng thử lại sau');
      } else {
        toast.error(rawMsg || 'Không thể gửi yêu cầu quên mật khẩu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (!confirmPassword.trim()) {
      toast.error('Vui lòng xác nhận mật khẩu mới');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp, vui lòng nhập lại');
      return;
    }

    if (!otp.trim() || otp.length !== 6) {
      toast.error('Vui lòng nhập đúng mã OTP gồm 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const res = await resetPasswordApi({
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      toast.success(res.message || 'Khôi phục mật khẩu thành công!');

      setEmail('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');

      router.push('/login');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errMsg = axiosError.response?.data?.message || 'Khôi phục mật khẩu thất bại';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[550px] p-8 bg-white rounded-xl shadow-sm border border-gray-100">
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

      <div className="text-[#2F6BFF] font-bold text-xl sm:text-2xl tracking-wider text-center w-full block mb-2 uppercase">
        QUÊN MẬT KHẨU
      </div>

      {step === 1 ? (
        <p className="text-sm sm:text-base text-gray-700 text-center mb-6">
          Vui lòng nhập email đã đăng ký tài khoản
        </p>
      ) : (
        <div className="text-sm sm:text-base text-gray-700 text-center mb-6 space-y-1 leading-relaxed">
          <p>Chúng tôi đã gửi mã xác minh qua số email</p>
          <p className="font-bold text-gray-900">{email}</p>
          <p>Bạn vui lòng kiểm tra và điền mã xác thực</p>
        </div>
      )}

      {step === 1 ? (
        /* FORM BƯỚC 1: NHẬP EMAIL */
        <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
          <div className="relative mt-2">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="forgot-email"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="example@gmail.com"
              autoComplete="email"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi xác thực'}
            </button>
          </div>
        </form>
      ) : (
        /* FORM BƯỚC 2: NHẬP MẬT KHẨU MỚI & OTP */
        <form onSubmit={handleResetPasswordSubmit} className="space-y-5" noValidate>
          <div className="relative mt-2">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
              Nhập mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400 pr-10 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 transition-colors cursor-pointer"
              >
                {showNewPassword ? <EyeIcon /> : <EyeSlashIcon />}
              </button>
            </div>
          </div>

          <div className="relative mt-2">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400 pr-10 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeIcon /> : <EyeSlashIcon />}
              </button>
            </div>
          </div>

          <div className="relative mt-2">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
              OTP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập mã OTP"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="text-center pt-1">
            <div className="text-[#2F6BFF] font-bold text-sm tracking-wider">
              {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Chưa nhận được mã?{' '}
              <button
                type="button"
                disabled={timer > 0 || isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    await forgotPasswordApi({ email });
                    toast.success('Gửi email thành công');
                    setTimer(60);
                  } catch (err: unknown) {
                    const axiosError = err as AxiosError<{ message?: string | string[] }>;
                    const msg = axiosError.response?.data?.message;
                    const rawMsg = Array.isArray(msg) ? msg[0] : msg || '';
                    toast.error(rawMsg || 'Gửi lại mã thất bại');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className={`font-semibold transition-colors ${
                  timer > 0 || isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:underline cursor-pointer'
                }`}
              >
                Gửi lại
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? 'Đang xử lý...' : 'Khôi phục mật khẩu'}
            </button>
          </div>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-gray-500">
        Bạn đã có tài khoản?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
};
