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

const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ProfileInput>({
  resolver: zodResolver(profileSchema),
  mode: 'onChange',
  defaultValues: {
    username: '',
    fullName: '',
    dateOfBirth: '',
    roleId: undefined,
    email: '',
    provinceId: '',
    wardId: '',
    isActive: true,
    avatarUrl: ''
  }
});

    const isActive = watch('isActive');
    const currentEmail = watch('email');
    const avatarUrl = watch('avatarUrl');
    const selectedProvinceId = watch('provinceId');
    const selectedWardId = watch('wardId');
    const currentRoleId = watch('roleId');
    const [imgError, setImgError] = useState(false);

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

          const dataToReset: ProfileInput = {
            username: profileData.username || profileData.account?.username || '',
            email: profileData.email || profileData.account?.email || '',
            fullName: profileData.fullName || '',
            dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
            gender: profileData.gender || '',
            position: profileData.position || '',
            roleId: profileData.roleId ?? profileData.account?.roleId ?? undefined,
            provinceId: provIdStr,
            wardId: wardIdStr,
            address: profileData.streetAddress || profileData.address || '',
            isActive: profileData.isActive ?? true,
            avatarUrl: formatAvatarUrl(profileData.avatar),
          };

          setInitialProfileData(dataToReset);
          reset(dataToReset);

          if (dataToReset.roleId) {
            setValue('roleId', dataToReset.roleId);
          }

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
          fullName: data.fullName || undefined,
          dateOfBirth: data.dateOfBirth || null,
          gender: (data.gender as 'male' | 'female') || undefined,
          province: selectedProv ? selectedProv.name : undefined,
          district: selectedW ? selectedW.name : undefined,
          streetAddress: data.address?.trim() || undefined,
        };

        if (avatarToSave !== undefined) {
          const relativeAvatar = avatarToSave
            ? avatarToSave.replace(/^https?:\/\/[^/]+/, '')
            : null;
          payload.avatar = relativeAvatar && !relativeAvatar.startsWith('blob:') && !relativeAvatar.startsWith('data:')
            ? relativeAvatar
            : (avatarToSave ? avatarToSave : null);
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
        const axiosError = error as AxiosError<{ message?: string }>;
        const errMsg = axiosError.response?.data?.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại!';
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
        await api.post('/users/email/change/request');
        toast.success('Mã xác thực đã được gửi về email hiện tại của bạn!');
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
          newEmail: cleanEmail
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
          
          <div className="bg-white px-6 py-3 flex items-center justify-between border border-gray-200 rounded-xl shadow-sm flex-shrink-0">  
            <h1 className="text-sm font-bold text-gray-800">Chi tiết người dùng</h1>
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={handleCancel}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5 disabled:bg-blue-400"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l6-6a1 1 0 00-1.414-1.414H9a1 1 0 00-.707.293z" />
                  <path d="M4 4a2 2 0 012-2h6a2 2 0 012 2v2a1 1 0 11-2 0V4H6v12h10v-2a1 1 0 112 0v2a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>

          <div className="p-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-1 items-start">
            
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
              <div 
                className="w-28 h-28 border border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center bg-gray-50/50 group relative overflow-hidden select-none"
              >
                {avatarUrl && !imgError ? (
                  <>
                    <Image
                      src={avatarUrl}
                      alt="Ảnh đại diện"
                      fill
                      sizes="112px"
                      className="object-cover"
                      unoptimized
                      onError={() => setImgError(true)}
                    />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={handleTriggerUpload}
                        className="text-[10px] text-white bg-blue-600/80 hover:bg-blue-600 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer w-[75px] text-center"
                      >
                        Thay đổi
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-[10px] text-white bg-red-600/80 hover:bg-red-600 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer w-[75px] text-center"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </>
                ) : (
                  /* Trường hợp chưa có ảnh: Click vào bất kỳ đâu trong vòng tròn để tải lên */
                  <div 
                    onClick={handleTriggerUpload}
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-[10px] text-gray-500 font-medium text-center px-2">Tải ảnh đại diện</span>
                  </div>
                )}
              </div>
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">*.jpeg, *.jpg, *.png. <br /> Kích thước tối đa 5 MB</p>

              <div className="w-full border-t border-gray-100 mt-5 pt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Kích hoạt</span>
                <button
                  type="button"
                  disabled
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-not-allowed ${
                    isActive ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-sm" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-10 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-800 mb-6 tracking-wide">Thông tin cá nhân</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
                  
                  <div className="relative mt-2">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-medium scale-90 origin-left z-10">Tên đăng nhập(*)</label>
                    <input {...register('username')} disabled type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed focus:outline-none" />
                  </div>

                  <div className="relative mt-2">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-medium scale-90 origin-left z-10">Họ và tên(*)</label>
                    <input {...register('fullName')} disabled type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed focus:outline-none" />
                  </div>

                  <div className="space-y-1">
                    <div className="relative mt-2">
                      <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-medium scale-90 origin-left z-10">Ngày tháng năm sinh</label>
                      <input 
                        {...register('dateOfBirth')} 
                        type="date" 
                        max={new Date().toLocaleDateString('en-CA')}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none bg-white text-gray-900 font-medium ${
                          errors.dateOfBirth ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`} 
                      />
                    </div>
                    {errors.dateOfBirth && <p className="text-red-500 text-[10px] pl-1 font-semibold"> {errors.dateOfBirth.message}</p>}
                  </div>

                  <div className="relative mt-2">
                    <select {...register('gender')} required className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:border-blue-500 text-gray-700 text-xs">
                      <option value="" disabled hidden>Giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>

                  <div className="relative mt-2">
                    <input {...register('position')} disabled type="text" placeholder="Chức danh" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed focus:outline-none placeholder-gray-300" />
                  </div>
                  <div className="relative mt-2">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-medium scale-90 origin-left z-10 select-none">
                      Vai trò <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={
                        currentRoleId === 1 ? 'Quản trị viên (ADMIN)' :
                        currentRoleId === 2 ? 'Quản lý (MANAGER)' :
                        currentRoleId === 3 ? 'Nhân viên (STAFF)' :
                        currentRoleId === 4 ? 'Kiểm toán viên (AUDITOR)' :
                        currentRoleId === 5 ? 'Người xem (VIEWER)' : 'Chưa phân quyền'
                      }
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-500 cursor-not-allowed focus:outline-none appearance-none text-xs font-semibold"
                    />
                  </div>
                  <div className="relative mt-2">
                    <div className="relative">
                      <input {...register('email')} disabled type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed focus:outline-none" />
                    </div>
                  </div>

                  <div className="relative mt-2">
                    <button type="button" onClick={handleRequestChangeEmail} className="px-3 py-2 text-blue-600 rounded-md font-semibold text-xs transition-colors">
                      Thay đổi
                    </button>
                  </div>

                </div>
              </div>

              <div className="w-full border-t border-gray-200/70 pt-2" />

              <div>
                <h3 className="text-xs font-bold text-gray-800 mb-6 tracking-wide">Thông tin liên hệ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
                  
                  <div className="relative mt-2">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-medium scale-90 origin-left z-10 select-none">Tỉnh/ thành phố</label>
                    <SearchableSelect
                      options={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
                      value={selectedProvinceId || ''}
                      onChange={(val) => {
                        setValue('provinceId', val);
                        handleProvinceChange(val);
                      }}
                      placeholder="Chọn tỉnh thành phố"
                    />
                  </div>

                  <div className="relative mt-2">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-medium scale-90 origin-left z-10 select-none">Phường xã</label>
                    <SearchableSelect
                      options={wards.map((w) => ({ value: String(w.id), label: w.name }))}
                      value={selectedWardId || ''}
                      onChange={(val) => setValue('wardId', val)}
                      placeholder="Chọn phường xã"
                      disabled={wards.length === 0}
                    />
                  </div>

                  <div className="md:col-span-2 relative mt-2">
                    <input {...register('address')} type="text" placeholder="Địa chỉ" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-gray-700 placeholder-gray-300" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>

        {showChangeEmailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl p-8 text-gray-700">
              <div className="text-[#2F6BFF] font-bold text-xl tracking-wider text-center w-full block mb-4 uppercase">THAY ĐỔI EMAIL</div>

              {emailStep === 1 ? (
                <form onSubmit={handleOtpConfirm} className="space-y-6" noValidate>
                  <div className="text-sm text-gray-600 text-center space-y-1 leading-relaxed">
                    <p>Chúng tôi đã gửi mã xác minh qua số email cũ</p>
                    <p className="font-bold text-gray-900">{currentEmail || '...'}</p>
                    <p>Bạn vui lòng kiểm tra và điền mã xác thực</p>
                  </div>

                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-gray-400 z-10">OTP <span className="text-red-500">*</span></label>
                    <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="Nhập mã OTP" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-sm text-gray-900" />
                  </div>

                  <div className="text-center">
                    {isEmailLoading ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2F6BFF]"></div>Đang xử lý...</div>
                    ) : (
                      <>
                        <div className="text-[#2F6BFF] font-bold text-sm tracking-wider">00:{emailTimer < 10 ? `0${emailTimer}` : emailTimer}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Chưa nhận được mã?{' '}
                          <button type="button" disabled={emailTimer > 0 || isEmailLoading} onClick={async () => {
                              setIsEmailLoading(true);
                              try {
                                await api.post('/users/email/change/request');
                                toast.success('Đã gửi lại mã xác thực!');
                                setEmailTimer(60);
                              } catch (err) {
                                toast.error('Gửi lại mã thất bại');
                              } finally { setIsEmailLoading(false); }
                            }} className={`font-semibold ${emailTimer > 0 || isEmailLoading ? 'text-gray-400' : 'text-blue-600 hover:underline'}`}>Gửi lại</button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <button type="submit" className="w-full py-2.5 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm">Xác nhận</button>
                    <button type="button" onClick={() => setShowChangeEmailModal(false)} className="w-full py-2 text-sm font-semibold text-gray-500 text-center block">Hủy bỏ</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleEmailConfirmSave} className="space-y-6" noValidate>
                  <div className="text-sm text-gray-500 text-center leading-relaxed">Vui lòng nhập email mới</div>

                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-gray-400 z-10">Email mới <span className="text-red-500">*</span></label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="example@gmail.com" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-sm text-gray-900" />
                  </div>

                  <div className="space-y-3 pt-2">
                    <button type="submit" disabled={isEmailLoading} className="w-full py-2.5 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm disabled:bg-blue-400">{isEmailLoading ? 'Đang lưu...' : 'Lưu'}</button>
                    <button type="button" onClick={() => { setShowChangeEmailModal(false); setEmailStep(1); }} className="w-full py-2 text-sm font-semibold text-gray-500 text-center block">Hủy bỏ</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </>
    );
  };