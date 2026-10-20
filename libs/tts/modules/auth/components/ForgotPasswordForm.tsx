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
    return 'Vui lòng nhập đúng định dạng email. Định dạng đúng ... @...';
  return null;
};

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
  const [timer, setTimer] = useState(300);

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
      const res = await forgotPasswordApi({ email });
      toast.success(res.message || 'Mã xác thực đã được gửi thành công!');
      setStep(2);
      setTimer(300);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      let errMsg = axiosError.response?.data?.message || 'Không thể gửi yêu cầu quên mật khẩu';
      
      if (axiosError.response?.status === 404 || errMsg === 'Không tìm thấy người dùng với email này') {
        errMsg = 'Email chưa đăng ký trong hệ thống. Vui lòng thử lại sau';
      }
      
      toast.error(errMsg);
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
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
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
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi xác thực'}
            </button>
          </div>
        </form>
      ) : (
        /* FORM BƯỚC 2: NHẬP MẬT KHẨU MỚI & OTP */
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Nhập mật khẩu mới *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400 pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
              >
                {showNewPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Xác nhận mật khẩu mới *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400 pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
              >
                {showConfirmPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              OTP *
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập mã OTP"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="text-center pt-2">
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
                    const res = await forgotPasswordApi({ email });
                    toast.success(res.message || 'Đã gửi lại mã xác thực!');
                    setTimer(300);
                  } catch (err: unknown) {
                    const axiosError = err as AxiosError<{ message?: string }>;
                    const errMsg = axiosError.response?.data?.message || 'Gửi lại mã thất bại';
                    toast.error(errMsg);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className={`font-semibold transition-colors ${
                  timer > 0 || isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:underline'
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
              className="w-full py-3 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
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