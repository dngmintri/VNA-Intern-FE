'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { api } from '@/libs/core/api/axios';
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

export interface UserFormProps {
  isModeCreate?: boolean;
  userId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  isModeCreate = true,
  userId = null,
  onSuccess,
  onCancel,
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(!isModeCreate);

  // Form states
  const [username, setUsername] = useState<string>('');
  // Mặc định mật khẩu đề xuất là 12345678 khi thêm mới
  const [password, setPassword] = useState<string>(isModeCreate ? '12345678' : '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [role, setRole] = useState<'ADMIN' | 'DOANH_NGHIEP'>('DOANH_NGHIEP');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [streetAddress, setStreetAddress] = useState<string>('');

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

  // Address dropdowns
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');



  const formatAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // 1. Tải danh sách tỉnh/thành phố
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await api.get<Province[]>('/location/provinces');
        setProvinces(res.data || []);
      } catch (err) {
        console.error('Lỗi tải danh mục tỉnh/thành:', err);
      }
    };
    fetchProvinces();
  }, []);

  // 2. Tải thông tin người dùng nếu đang ở chế độ chỉnh sửa
  useEffect(() => {
    if (!isModeCreate && userId) {
      const fetchUserData = async () => {
        setIsFetchingData(true);
        try {
          const res = await api.get<{ data?: any } & any>(`/users/profilebyid/${userId}`);
          const userData = res.data?.data || res.data;
          if (userData) {
            setUsername(userData.username || '');
            setFullName(userData.fullName || '');
            setEmail(userData.email || '');
            setPosition(userData.position || '');
            setGender(userData.gender === 'female' ? 'female' : 'male');
            const rawRole =
              (typeof userData.role === 'object' && userData.role !== null
                ? userData.role.name
                : userData.role) ||
              userData.roleCode ||
              '';
            if (rawRole) {
              const upper = String(rawRole).toUpperCase();
              if (upper.includes('DOANH_NGHIEP') || upper.includes('ENTERPRISE') || upper.includes('DOANH NGHIỆP')) {
                setRole('DOANH_NGHIEP');
              } else {
                setRole('ADMIN');
              }
            }
            if (userData.isActive !== undefined) {
              setIsActive(userData.isActive);
            }
            setDateOfBirth(userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '');
            setStreetAddress(userData.streetAddress || '');

            if (userData.avatar) {
              setAvatarUrl(formatAvatarUrl(userData.avatar));
            }

            if (userData.province && provinces.length > 0) {
              const matchedProv = provinces.find((p) => p.name === userData.province);
              if (matchedProv) {
                setSelectedProvinceId(String(matchedProv.id));
                const wardsRes = await api.get<Ward[]>(`/location/provinces/${matchedProv.id}/wards`);
                const wardList = wardsRes.data || [];
                setWards(wardList);
                if (userData.district) {
                  const matchedWard = wardList.find((w) => w.name === userData.district);
                  if (matchedWard) {
                    setSelectedWardId(String(matchedWard.id));
                  }
                }
              }
            }
          }
        } catch (error: unknown) {
          const axiosError = error as AxiosError<{ message?: string }>;
          toast.error(axiosError.response?.data?.message || 'Không thể tải thông tin người dùng');
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchUserData();
    }
  }, [isModeCreate, userId, provinces]);

  // Khi chọn tỉnh/thành -> Tải danh sách phường/xã tương ứng
  const handleProvinceChange = async (provId: string) => {
    setSelectedProvinceId(provId);
    setSelectedWardId('');
    if (!provId) {
      setWards([]);
      return;
    }
    try {
      const res = await api.get<Ward[]>(`/location/provinces/${provId}/wards`);
      setWards(res.data || []);
    } catch (err) {
      console.error('Lỗi tải phường/xã:', err);
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
      setAvatarUrl(previewUrl);
      setImgError(false);
    }
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setAvatarUrl('');
    toast.success('Đã gỡ ảnh đại diện tạm thời! Bấm "Lưu" để cập nhật chính thức.');
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFullName = fullName.trim();
    if (!cleanFullName) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }
    if (cleanFullName.length < 2 || cleanFullName.length > 100) {
      toast.error('Họ và tên phải có độ dài từ 2 đến 100 ký tự');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Vui lòng nhập email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error('Email không đúng định dạng (ví dụ: user@example.com)');
      return;
    }
    if (cleanEmail.length > 255) {
      toast.error('Email không được vượt quá 255 ký tự');
      return;
    }

    if (isModeCreate) {
      const cleanUsername = username.trim();
      if (!cleanUsername) {
        toast.error('Vui lòng nhập tên đăng nhập');
        return;
      }
      if (cleanUsername.length < 4 || cleanUsername.length > 30) {
        toast.error('Tên đăng nhập phải có độ dài từ 4 đến 30 ký tự');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        toast.error('Tên đăng nhập chỉ được chứa chữ cái không dấu, số và dấu gạch dưới (_), không chứa khoảng trắng');
        return;
      }

      // Mật khẩu không ràng buộc phức tạp, chỉ kiểm tra không để trống
      if (!password.trim()) {
        toast.error('Vui lòng nhập mật khẩu');
        return;
      }
    }

    // Ngày tháng năm sinh: chỉ cần không lớn hơn ngày hiện tại (<= today)
    if (dateOfBirth) {
      const inputDob = new Date(dateOfBirth);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (inputDob > today) {
        toast.error('Ngày tháng năm sinh không được lớn hơn ngày hiện tại');
        return;
      }
    }

    if (position && position.trim().length > 100) {
      toast.error('Chức danh không được vượt quá 100 ký tự');
      return;
    }

    if (streetAddress && streetAddress.trim().length > 255) {
      toast.error('Địa chỉ không được vượt quá 255 ký tự');
      return;
    }

    const selectedProv = provinces.find((p) => String(p.id) === String(selectedProvinceId));
    const selectedWard = wards.find((w) => String(w.id) === String(selectedWardId));

    setIsLoading(true);
    try {
      let avatarToSave = avatarUrl;

      // Upload file ảnh nếu người dùng chọn ảnh mới
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (!isModeCreate && userId) {
          formData.append('userId', userId);
        }
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
      } else if (!avatarUrl) {
        avatarToSave = '';
      }

      const relativeAvatar = avatarToSave
        ? avatarToSave.replace(/^https?:\/\/[^/]+/, '')
        : null;

      const cleanAvatar = relativeAvatar && !relativeAvatar.startsWith('blob:') && !relativeAvatar.startsWith('data:')
        ? relativeAvatar
        : null;

      if (isModeCreate) {
        const payload = {
          username: username.trim(),
          password,
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          position: position.trim() || null,
          role,
          isActive,
          avatar: cleanAvatar,
          gender,
          dateOfBirth: dateOfBirth || null,
          province: selectedProv ? selectedProv.name : null,
          district: selectedWard ? selectedWard.name : null,
          streetAddress: streetAddress.trim() || null,
        };

        await api.post('/users/create', payload);
        toast.success('Tạo người dùng mới thành công!');
      } else {
        const payload = {
          fullName: fullName.trim(),
          email: cleanEmail,
          position: position.trim() || null,
          role,
          isActive,
          avatar: cleanAvatar,
          gender,
          dateOfBirth: dateOfBirth || null,
          province: selectedProv ? selectedProv.name : null,
          district: selectedWard ? selectedWard.name : null,
          streetAddress: streetAddress.trim() || null,
        };

        await api.patch(`/users/profile/${userId}`, payload);
        toast.success('Cập nhật người dùng thành công!');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/users');
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const msg = axiosError.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Đã xảy ra lỗi, vui lòng thử lại!'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-[#F4F6F9] min-h-[400px]">
        <div className="text-gray-400 font-medium text-xs animate-pulse">
          Đang tải dữ liệu người dùng...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      {/* Header bar chuẩn Figma */}
      <div className="bg-white px-6 py-3.5 flex items-center justify-between border-b border-gray-200 shadow-2xs flex-shrink-0">
        <h1 className="text-sm font-bold text-gray-800">
          Chi tiết người dùng
        </h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (onCancel ? onCancel() : router.push('/dashboard/users'))}
            className="text-gray-500 hover:text-gray-800 text-xs font-semibold px-2 py-1.5 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8" />
            </svg>
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* Form Content 2 cột chuẩn Figma */}
      <div className="p-6 max-w-6xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* CỘT TRÁI: Avatar & Kích hoạt */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
            <div 
              className="w-32 h-32 border border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center bg-gray-50/50 group relative overflow-hidden select-none"
            >
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

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <p className="text-[10.5px] text-gray-400 text-center mt-3.5 leading-relaxed">
              *.jpeg, *.jpg, *.png. <br /> Kích thước tối đa 5 MB
            </p>

            <div className="w-full border-t border-gray-100 mt-6 pt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Kích hoạt</span>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                  isActive ? 'bg-[#2F6BFF] justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-xs" />
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: Toàn bộ thông tin cá nhân & thông tin liên hệ */}
          <div className="lg:col-span-9 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            
            {/* PHẦN 1: Thông tin cá nhân */}
            <div>
              <h3 className="text-xs font-bold text-gray-800 mb-4 tracking-wide uppercase">
                Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 text-xs">
                
                {/* Hàng 1 */}
                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                    Tên đăng nhập(*)
                  </label>
                  <input
                    type="text"
                    disabled={!isModeCreate}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập"
                    className={`w-full h-10 px-3 border rounded-lg text-xs focus:outline-none transition-colors ${
                      !isModeCreate
                        ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 text-gray-800 focus:border-blue-500 bg-white'
                    }`}
                  />
                </div>

                {isModeCreate ? (
                  /* Mật khẩu khi tạo mới: đề xuất sẵn 12345678, người dùng có thể bấm vào sửa tùy ý */
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Mật khẩu *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white pr-9 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Ở chế độ chỉnh sửa: Hàng 1 cột phải là Họ và tên */
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Họ và tên(*)
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white transition-colors"
                    />
                  </div>
                )}

                {/* Hàng 2 */}
                {isModeCreate ? (
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Họ và tên(*)
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên"
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white transition-colors"
                    />
                  </div>
                ) : null}

                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                    Ngày tháng năm sinh
                  </label>
                  <input
                    type="date"
                    max={new Date().toLocaleDateString('en-CA')}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white cursor-pointer transition-colors"
                  />
                </div>

                {!isModeCreate ? (
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Giới tính
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>
                ) : null}

                {/* Hàng 3 */}
                {isModeCreate ? (
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Giới tính
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>
                ) : null}

                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                    Chức danh
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Nhập chức danh"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white transition-colors"
                  />
                </div>

                {!isModeCreate ? (
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Vai trò *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'ADMIN' | 'DOANH_NGHIEP')}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium transition-colors"
                    >
                      <option value="ADMIN">Quản trị viên</option>
                      <option value="DOANH_NGHIEP">Doanh nghiệp</option>
                    </select>
                  </div>
                ) : null}

                {/* Hàng 4 */}
                {isModeCreate ? (
                  <div className="relative mt-2">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                      Vai trò *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'ADMIN' | 'DOANH_NGHIEP')}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium transition-colors"
                    >
                      <option value="ADMIN">Quản trị viên</option>
                      <option value="DOANH_NGHIEP">Doanh nghiệp</option>
                    </select>
                  </div>
                ) : null}

                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    maxLength={255}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white transition-colors"
                  />
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
                    value={selectedProvinceId}
                    onChange={handleProvinceChange}
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
                    value={selectedWardId}
                    onChange={(wId) => setSelectedWardId(wId)}
                    placeholder="Chọn phường / xã"
                    disabled={!selectedProvinceId}
                  />
                </div>

                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10 select-none">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Địa chỉ"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>


    </div>
  );
};

export default UserForm;
