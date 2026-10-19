'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(!isModeCreate);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [role, setRole] = useState<'ADMIN' | 'DOANH_NGHIEP'>('DOANH_NGHIEP');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState<string>('');

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');

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
            setGender(userData.gender === 'female' ? 'female' : 'male');
            if (userData.role === 'ADMIN' || userData.role === 'DOANH_NGHIEP') {
              setRole(userData.role);
            }
            setDateOfBirth(userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '');
            setStreetAddress(userData.streetAddress || '');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    if (isModeCreate) {
      if (!username.trim()) {
        toast.error('Vui lòng nhập tên tài khoản (username)');
        return;
      }
      if (!password || password.length < 6) {
        toast.error('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Vui lòng nhập email hợp lệ');
        return;
      }
    }

    const selectedProv = provinces.find((p) => String(p.id) === String(selectedProvinceId));
    const selectedWard = wards.find((w) => String(w.id) === String(selectedWardId));

    setIsLoading(true);
    try {
      if (isModeCreate) {
        const payload = {
          username: username.trim(),
          password,
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          role,
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
          role,
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
      {/* Header bar */}
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Hệ thống</span>
          <span className="text-xs text-gray-400">❯</span>
          <button
            type="button"
            onClick={() => router.push('/dashboard/users')}
            className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            Quản lý người dùng
          </button>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-800">
            {isModeCreate ? 'Thêm mới người dùng' : 'Chỉnh sửa người dùng'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (onCancel ? onCancel() : router.push('/dashboard/users'))}
            className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isLoading ? 'Đang lưu...' : isModeCreate ? 'Tạo tài khoản' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              {isModeCreate ? 'Thông tin tài khoản mới' : 'Thông tin người dùng'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên tài khoản (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isModeCreate}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username"
                  className={`w-full px-3 py-2 border rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 ${
                    !isModeCreate ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                  }`}
                />
              </div>

              {isModeCreate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mật khẩu khởi tạo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  disabled={!isModeCreate}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={`w-full px-3 py-2 border rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 ${
                    !isModeCreate ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                  }`}
                />
                {!isModeCreate && (
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    (Email chỉ có thể đổi qua quy trình xác thực mã OTP tại màn hình cá nhân)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Giới tính</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Vai trò (Quyền hạn) <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'ADMIN' | 'DOANH_NGHIEP')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                >
                  <option value="DOANH_NGHIEP">Doanh nghiệp</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              Địa chỉ liên hệ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                <SearchableSelect
                  options={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
                  value={selectedProvinceId}
                  onChange={handleProvinceChange}
                  placeholder="Chọn tỉnh / thành phố"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quận / Huyện / Phường / Xã</label>
                <SearchableSelect
                  options={wards.map((w) => ({ value: String(w.id), label: w.name }))}
                  value={selectedWardId}
                  onChange={(wId) => setSelectedWardId(wId)}
                  placeholder="Chọn quận / huyện / xã"
                  disabled={!selectedProvinceId}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ chi tiết (Số nhà, đường...)</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => (onCancel ? onCancel() : router.push('/dashboard/users'))}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? 'Đang lưu...' : isModeCreate ? 'Tạo mới người dùng' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
