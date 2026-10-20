'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileInput } from '../schemas/profile.schema';
import { api } from '@/libs/core/api/axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useAuthStore } from '@/libs/tts/store/auth.store';
import { AxiosError } from 'axios';
import { SearchableSelect } from '../../company/components/SearchableSelect';

interface Province {
  id: number | string;
  name: string;
}

interface Ward {
  id: number | string;
  name: string;
  provinceId: number | string;
}

interface UserProfileResponse {
  id: number | string;
  fullName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  position?: string | null;
  address?: string | null;
  streetAddress?: string | null;
  province?: string | null;
  district?: string | null;
  provinceId?: string | number | null;
  wardId?: string | number | null;
  isActive?: boolean;
  avatar?: string | null;
  role?: string | { id?: number | string; name?: string } | null;
  roleId?: number | null;
  username?: string;
  email?: string;
  account?: {
    id: number | string;
    username: string;
    email: string;
    accountType?: string;
    roleId?: number | null;
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatAvatarUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const ProfileForm = () => {
  const { setAvatar, setFullName } = useAuthStore();
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [initialProfileData, setInitialProfileData] = useState<ProfileInput | null>(null);

  const [showChangeEmailModal, setShowChangeEmailModal] = useState<boolean>(false);
  const [emailStep, setEmailStep] = useState<number>(1);
  const [otpCode, setOtpCode] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [emailTimer, setEmailTimer] = useState<number>(60);
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      fullName: '',
      dateOfBirth: '',
      gender: 'male',
      position: '',
      role: 'ADMIN',
      email: '',
      provinceId: '',
      wardId: '',
      address: '',
      isActive: true,
      avatarUrl: '',
    },
  });

  const isActive = watch('isActive');
  const currentEmail = watch('email');
  const avatarUrl = watch('avatarUrl');
  const selectedProvinceId = watch('provinceId');
  const selectedWardId = watch('wardId');
  const currentRole = watch('role');

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showChangeEmailModal && emailStep === 1 && emailTimer > 0) {
      interval = setInterval(() => {
        setEmailTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showChangeEmailModal, emailStep, emailTimer]);

  useEffect(() => {
    const initData = async () => {
      try {
        const [provRes, userRes] = await Promise.all([
          api.get<Province[]>('/location/provinces'),
          api.get<{ data?: UserProfileResponse } & UserProfileResponse>('/users/profile'),
        ]);

        const provList = provRes.data || [];
        setProvinces(provList);

        const profileData = userRes.data?.data || userRes.data;
        if (!profileData) return;

        let loadedWards: Ward[] = [];
        let provIdStr = '';
        if (profileData.provinceId) {
          provIdStr = String(profileData.provinceId);
        } else if (profileData.province) {
          const matchedProv = provList.find((p) => p.name === profileData.province);
          if (matchedProv) {
            provIdStr = String(matchedProv.id);
          }
        }

        if (provIdStr) {
          try {
            const wardsResponse = await api.get<Ward[]>(`/location/provinces/${provIdStr}/wards`);
            if (wardsResponse.data) {
              loadedWards = wardsResponse.data;
              setWards(loadedWards);
            }
          } catch (err) {
            console.error('Lỗi lấy danh sách phường xã ban đầu:', err);
          }
        }

        let wardIdStr = '';
        if (profileData.wardId) {
          wardIdStr = String(profileData.wardId);
        } else if (profileData.district && loadedWards.length > 0) {
          const matchedWard = loadedWards.find((w) => w.name === profileData.district);
          if (matchedWard) {
            wardIdStr = String(matchedWard.id);
          }
        }

        // Nhận diện vai trò từ API backend
        let userRole = 'ADMIN';
        const rawRole =
          (typeof profileData.role === 'object' && profileData.role !== null
            ? profileData.role.name
            : profileData.role) ||
          profileData.account?.accountType ||
          '';

        if (rawRole) {
          const upper = String(rawRole).toUpperCase();
          if (upper.includes('DOANH_NGHIEP') || upper.includes('ENTERPRISE') || upper.includes('DOANH NGHIỆP')) {
            userRole = 'DOANH_NGHIEP';
          } else {
            userRole = 'ADMIN';
          }
        }

        const dataToReset: ProfileInput = {
          username: profileData.username || profileData.account?.username || '',
          email: profileData.email || profileData.account?.email || '',
          fullName: profileData.fullName || '',
          dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
          gender: profileData.gender === 'female' ? 'female' : 'male',
          position: profileData.position || '',
          role: userRole,
          provinceId: provIdStr,
          wardId: wardIdStr,
          address: profileData.streetAddress || profileData.address || '',
          isActive: profileData.isActive !== undefined ? profileData.isActive : true,
          avatarUrl: formatAvatarUrl(profileData.avatar),
        };

        setInitialProfileData(dataToReset);
        reset(dataToReset);

        setFullName(dataToReset.fullName || dataToReset.username);
        setAvatar(dataToReset.avatarUrl || null);
      } catch (error) {
        console.error('Lỗi lấy thông tin Profile:', error);
        toast.error('Không thể tải thông tin tài khoản');
      } finally {
        setIsFetching(false);
      }
    };

    initData();
  }, [reset, setValue, setAvatar, setFullName]);

  const handleProvinceChange = async (provId: string) => {
    if (!provId) {
      setWards([]);
      setValue('wardId', '');
      return;
    }
    try {
      const response = await api.get<Ward[]>(`/location/provinces/${provId}/wards`);
      if (response.data) {
        setWards(response.data);
        setValue('wardId', '');
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách phường xã:', error);
    }
  };

  const handleCancel = async () => {
    if (initialProfileData) {
      setIsFetching(true);
      try {
        if (initialProfileData.provinceId) {
          const response = await api.get<Ward[]>(`/location/provinces/${initialProfileData.provinceId}/wards`);
          if (response.data) {
            setWards(response.data);
          }
        } else {
          setWards([]);
        }

        reset(initialProfileData);
        toast.success('Đã khôi phục dữ liệu ban đầu!');
      } catch (error) {
        console.error('Lỗi khi khôi phục dữ liệu:', error);
        toast.error('Khôi phục dữ liệu thất bại!');
      } finally {
        setIsFetching(false);
      }
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    setIsSaving(true);
    try {
      let avatarToSave = data.avatarUrl;

      // Nếu có chọn file ảnh mới -> upload lên backend lưu vào uploads/avatars
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/users/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const uploadData = uploadRes.data?.data || uploadRes.data;
        if (uploadData?.avatar) {
          avatarToSave = uploadData.avatar;
        }
        setSelectedFile(null);
      } else if (!data.avatarUrl) {
        avatarToSave = null;
      }

      const currentProvinceId = watch('provinceId');
      const currentWardId = watch('wardId');
      const selectedProv = provinces.find((p) => String(p.id) === String(currentProvinceId));
      const selectedW = wards.find((w) => String(w.id) === String(currentWardId));

      const payload: Record<string, unknown> = {
        fullName: data.fullName?.trim() || undefined,
        dateOfBirth: data.dateOfBirth || null,
        gender: (data.gender as 'male' | 'female') || undefined,
        position: data.position?.trim() || null,
        role: data.role || undefined,
        isActive: data.isActive,
        province: selectedProv ? selectedProv.name : null,
        district: selectedW ? selectedW.name : null,
        streetAddress: data.address?.trim() || null,
      };

      if (avatarToSave !== undefined) {
        const relativeAvatar = avatarToSave
          ? avatarToSave.replace(/^https?:\/\/[^/]+/, '')
          : null;
        payload.avatar =
          relativeAvatar && !relativeAvatar.startsWith('blob:') && !relativeAvatar.startsWith('data:')
            ? relativeAvatar
            : avatarToSave
            ? avatarToSave
            : null;
      }

      await api.patch('/users/profile', payload);
      toast.success('Cập nhật thông tin hồ sơ tài khoản thành công!');

      const displayAvatar = formatAvatarUrl((payload.avatar as string) || avatarToSave);
      setValue('avatarUrl', displayAvatar);
      setAvatar(displayAvatar || null);

      if (initialProfileData) {
        setInitialProfileData({
          ...initialProfileData,
          fullName: data.fullName || initialProfileData.fullName,
          dateOfBirth: data.dateOfBirth || initialProfileData.dateOfBirth,
          gender: data.gender || initialProfileData.gender,
          position: data.position || initialProfileData.position,
          role: data.role || initialProfileData.role,
          isActive: data.isActive !== undefined ? data.isActive : initialProfileData.isActive,
          address: data.address || initialProfileData.address,
          provinceId: currentProvinceId ? String(currentProvinceId) : initialProfileData.provinceId,
          wardId: currentWardId ? String(currentWardId) : initialProfileData.wardId,
          avatarUrl: displayAvatar,
        });
      }

      if (data.fullName) {
        setFullName(data.fullName);
      }
    } catch (error: unknown) {
      console.error('Lỗi cập nhật database:', error);
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const msg = axiosError.response?.data?.message;
      const errMsg = Array.isArray(msg) ? msg[0] : msg || 'Cập nhật thất bại. Vui lòng kiểm tra lại!';
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh tối đa là 5MB');
        return;
      }
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setValue('avatarUrl', previewUrl);
      setImgError(false);
    }
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setValue('avatarUrl', '');
    toast.success('Đã gỡ ảnh đại diện tạm thời! Bấm "Lưu" để cập nhật chính thức.');
  };

  const handleRequestChangeEmail = async () => {
    setShowChangeEmailModal(true);
    setEmailStep(1);
    setOtpCode('');
    setNewEmail('');
    setEmailTimer(60);
    setIsEmailLoading(true);

    try {
      const res = await api.post('/users/email/change/request');
      const devOtp = res.data?.data?.devOtp || res.data?.devOtp;
      if (devOtp) {
        toast.success(`Mã xác minh đã được gửi! (Dev: ${devOtp})`);
      } else {
        toast.success('Mã xác thực đã được gửi về email hiện tại của bạn!');
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errMsg = axiosError.response?.data?.message || 'Không thể gửi yêu cầu thay đổi email';
      toast.error(errMsg);
      setShowChangeEmailModal(false);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleOtpConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error('Vui lòng nhập đúng mã OTP gồm 6 ký tự');
      return;
    }
    setIsEmailLoading(true);
    try {
      await api.post('/users/email/change/verify-otp', { otp: otpCode.trim() });
      toast.success('Mã xác thực hợp lệ! Vui lòng nhập email mới.');
      setEmailStep(2);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errMsg = axiosError.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn';
      toast.error(errMsg);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = newEmail.trim();
    if (!cleanEmail) {
      toast.error('Vui lòng điền địa chỉ email mới');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      toast.error('Định dạng email mới không hợp lệ. Ví dụ đúng: example@domain.com');
      return;
    }
    if (cleanEmail.toLowerCase() === currentEmail?.toLowerCase()) {
      toast.error('Email mới không được trùng với địa chỉ email hiện tại của hệ thống');
      return;
    }

    setIsEmailLoading(true);
    try {
      await api.patch('/users/email/change', {
        newEmail: cleanEmail,
      });

      toast.success('Thay đổi email thành công!');
      setValue('email', cleanEmail);

      setShowChangeEmailModal(false);
      setOtpCode('');
      setNewEmail('');
      setEmailStep(1);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errMsg = axiosError.response?.data?.message || 'Thay đổi email thất bại';
      toast.error(errMsg);
    } finally {
      setIsEmailLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F4F6F9] min-h-screen">
        <div className="text-sm font-medium text-gray-500 animate-pulse">
          Đang tải thông tin tài khoản từ hệ thống...
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
        {/* Header Bar chuẩn Figma */}
        <div className="bg-white px-6 py-3.5 flex items-center justify-between border-b border-gray-200 shadow-2xs flex-shrink-0">
          <h1 className="text-sm font-bold text-gray-800">Chi tiết người dùng</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-800 text-xs font-semibold px-2 py-1.5 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8" />
              </svg>
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>

        {/* Content 2 cột chuẩn Figma */}
        <div className="p-6 max-w-6xl w-full mx-auto">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* CỘT TRÁI: Avatar & Kích hoạt */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
              <div className="w-32 h-32 border border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center bg-gray-50/50 group relative overflow-hidden select-none">
                {avatarUrl && !imgError ? (
                  <>
                    <Image
                      src={avatarUrl}
                      alt="Ảnh đại diện"
                      fill
                      sizes="128px"
                      className="object-cover"
                      unoptimized
                      onError={() => setImgError(true)}
                    />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={handleTriggerUpload}
                        className="text-[10px] text-white bg-blue-600/80 hover:bg-blue-600 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer w-[75px] text-center"
                      >
                        Thay đổi
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-[10px] text-white bg-red-600/80 hover:bg-red-600 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer w-[75px] text-center"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={handleTriggerUpload}
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/70 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-400 mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-[11px] text-gray-500 font-medium text-center px-2">Tải ảnh đại diện</span>
                  </div>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <p className="text-[10.5px] text-gray-400 text-center mt-3.5 leading-relaxed">
                *.jpeg, *.jpg, *.png. <br /> Kích thước tối đa 5 MB
              </p>

              {/* Toggle Kích hoạt - cho phép chỉnh sửa */}
              <div className="w-full border-t border-gray-100 mt-6 pt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Kích hoạt</span>
                <button
                  type="button"
                  onClick={() => setValue('isActive', !isActive, { shouldDirty: true })}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    isActive ? 'bg-[#2F6BFF] justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-xs" />
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: Thông tin cá nhân & Thông tin liên hệ */}
            <div className="lg:col-span-9 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              {/* PHẦN 1: Thông tin cá nhân */}
              <div>
                <h3 className="text-xs font-bold text-gray-800 mb-4 tracking-wide uppercase">
                  Thông tin cá nhân
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 text-xs">
                  {/* Hàng 1: Tên đăng nhập (DUY NHẤT trường này khóa) & Họ và tên (cho phép chỉnh sửa) */}
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Tên đăng nhập(*)
                    </label>
                    <input
                      {...register('username')}
                      disabled
                      type="text"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>

                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Họ và tên(*)
                    </label>
                    <input
                      {...register('fullName')}
                      type="text"
                      placeholder="Nhập họ và tên"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white transition-colors"
                    />
                    {errors.fullName && <p className="text-red-500 text-[10px] pl-1 font-semibold mt-1">{errors.fullName.message}</p>}
                  </div>

                  {/* Hàng 2: Ngày tháng năm sinh & Giới tính */}
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Ngày tháng năm sinh
                    </label>
                    <input
                      {...register('dateOfBirth')}
                      type="date"
                      max={new Date().toLocaleDateString('en-CA')}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white cursor-pointer transition-colors"
                    />
                    {errors.dateOfBirth && <p className="text-red-500 text-[10px] pl-1 font-semibold mt-1">{errors.dateOfBirth.message}</p>}
                  </div>

                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Giới tính
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>

                  {/* Hàng 3: Chức danh & Vai trò * */}
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Chức danh
                    </label>
                    <input
                      {...register('position')}
                      type="text"
                      placeholder="Nhập chức danh"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white transition-colors"
                    />
                  </div>

                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Vai trò *
                    </label>
                    <select
                      {...register('role')}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium transition-colors"
                    >
                      <option value="ADMIN">Quản trị viên</option>
                      <option value="DOANH_NGHIEP">Doanh nghiệp</option>
                    </select>
                  </div>

                  {/* Hàng 4: Email & Nút Thay đổi */}
                  <div className="relative mt-2 flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                        Email
                      </label>
                      <input
                        {...register('email')}
                        disabled
                        type="email"
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-xs text-gray-600 bg-gray-50 cursor-not-allowed font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestChangeEmail}
                      className="h-10 px-3.5 text-xs font-semibold text-[#2F6BFF] hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200 flex items-center justify-center flex-shrink-0"
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: Thông tin liên hệ */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-800 mb-4 tracking-wide uppercase">
                  Thông tin liên hệ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      Tỉnh / thành phố
                    </label>
                    <SearchableSelect
                      size="md"
                      options={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
                      value={selectedProvinceId || ''}
                      onChange={(val) => {
                        setValue('provinceId', val);
                        handleProvinceChange(val);
                      }}
                      placeholder="Chọn tỉnh / thành phố"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      Phường xã (Quận / Huyện)
                    </label>
                    <SearchableSelect
                      size="md"
                      options={wards.map((w) => ({ value: String(w.id), label: w.name }))}
                      value={selectedWardId || ''}
                      onChange={(val) => setValue('wardId', val)}
                      placeholder="Chọn phường / xã"
                      disabled={!selectedProvinceId}
                    />
                  </div>

                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Địa chỉ
                    </label>
                    <input
                      {...register('address')}
                      type="text"
                      placeholder="Địa chỉ"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* POPUP THAY ĐỔI EMAIL THEO FIGMA */}
      {showChangeEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7 relative">
            <h3 className="text-lg font-bold text-[#2F6BFF] text-center mb-3 tracking-wide uppercase">
              THAY ĐỔI EMAIL
            </h3>

            {emailStep === 1 ? (
              <form onSubmit={handleOtpConfirm} className="space-y-4">
                <p className="text-xs text-gray-600 text-center mb-1">
                  Chúng tôi đã gửi mã xác minh qua số email cũ
                </p>
                <p className="text-xs font-bold text-gray-800 text-center mb-1">
                  {currentEmail}
                </p>
                <p className="text-xs text-gray-600 text-center mb-4">
                  Bạn vui lòng kiểm tra và điền mã xác thực
                </p>

                <div className="relative mb-3">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                    OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nhập 6 chữ số OTP"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs tracking-widest text-center font-bold text-gray-800 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <span>
                    Mã hết hạn sau:{' '}
                    <span className="font-semibold text-blue-600">
                      00:{emailTimer < 10 ? `0${emailTimer}` : emailTimer}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={emailTimer > 0 || isEmailLoading}
                    onClick={handleRequestChangeEmail}
                    className="text-blue-600 hover:underline font-semibold disabled:text-gray-300 disabled:no-underline cursor-pointer"
                  >
                    Gửi lại mã
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangeEmailModal(false);
                      setOtpCode('');
                    }}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isEmailLoading || otpCode.length !== 6}
                    className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {isEmailLoading ? 'Đang kiểm tra...' : 'Xác thực OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEmailConfirmSave} className="space-y-4">
                <p className="text-xs text-gray-600 text-center mb-4 leading-relaxed">
                  Xác thực OTP thành công. Vui lòng nhập địa chỉ email mới của bạn:
                </p>

                <div className="relative mb-3">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                    Email mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="example@domain.com"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangeEmailModal(false);
                      setNewEmail('');
                    }}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isEmailLoading}
                    className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {isEmailLoading ? 'Đang lưu...' : 'Lưu email mới'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileForm;
