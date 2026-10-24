'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { api } from '@/libs/core/api/axios';
import { useAuthStore } from '@/libs/tts/store/auth.store';
import { decodeJwt } from '@/libs/shared/utils/jwt';
import { SearchableSelect } from './SearchableSelect';
import { companySchema, CompanyInput } from '../schemas/company.schema';

interface Province {
  id: number;
  name: string;
}

interface Ward {
  id: number;
  name: string;
  provinceId: number;
}

interface FilterItem {
  id: number;
  name: string;
  code?: string;
}

interface CompanyProfileResponse {
  taxCode: string;
  companyName: string;
  foreignCompanyName: string | null;
  licenseIssueDate: string | null;
  businessType: string | null;
  businessIndustry: string | null;
  email: string | null;
  status: string;
  provinceDKKD: string | null;
  wardDKKD: string | null;
  addressDKKD: string | null;
  provinceHDKD: string | null;
  wardHDKD: string | null;
  addressHDKD: string | null;
  representativeName: string | null;
  representativePhone: string | null;
  businessPhone: string | null;
  gpkdFile: string | null;
  gtkFile: string | null;
}

const formatToInputDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  let normalized = dateStr;
  if (normalized.includes('T')) {
    normalized = normalized.split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  const sep = normalized.includes('/') ? '/' : '-';
  const parts = normalized.split(sep);
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
  return normalized;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CompanyProfileForm = () => {
  const { accessToken } = useAuthStore();
  const decoded = accessToken ? decodeJwt(accessToken) : null;
  const taxCode = decoded?.username || '';

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [initialProfileData, setInitialProfileData] = useState<CompanyInput | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [businessTypes, setBusinessTypes] = useState<FilterItem[]>([]);
  const [businessIndustries, setBusinessIndustries] = useState<FilterItem[]>([]);

  const [dkkdWards, setDkkdWards] = useState<Ward[]>([]);
  const [hdkdWards, setHdkdWards] = useState<Ward[]>([]);

  const [selectedDkkdProvId, setSelectedDkkdProvId] = useState<string>('');
  const [selectedHdkdProvId, setSelectedHdkdProvId] = useState<string>('');

  const [gpkdUploading, setGpkdUploading] = useState<boolean>(false);
  const [gpkdProgress, setGpkdProgress] = useState<number>(0);
  const [gtkUploading, setGtkUploading] = useState<boolean>(false);
  const [gtkProgress, setGtkProgress] = useState<number>(0);

  const [showChangeEmailModal, setShowChangeEmailModal] = useState<boolean>(false);
  const [emailStep, setEmailStep] = useState<number>(1);
  const [otpCode, setOtpCode] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [emailTimer, setEmailTimer] = useState<number>(60);
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);

  const fileInputGpkdRef = useRef<HTMLInputElement>(null);
  const fileInputGtkRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    mode: 'onChange',
    defaultValues: {
      business_name: '',
      tax_code: '',
      business_type: '',
      business_industry: '',
      license_issue_date: '',
      license_registration_province: '',
      license_registration_ward: '',
      license_registration_adress: '',
      email: '',
      business_phone: '',
      representative_name: '',
      representative_phone: '',
      business_operating_province: '',
      business_operating_ward: '',
      business_operating_adress: '',
      business_license_file_url: '',
      other_document_file_url: '',
    },
  });

  const businessLicenseFileUrlVal = watch('business_license_file_url');
  const otherDocumentFileUrlVal = watch('other_document_file_url');
  const currentEmail = watch('email');

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
        const [provRes, btRes, biRes] = await Promise.all([
          api.get<Province[]>('/location/provinces'),
          api.get<FilterItem[]>('/company/business-type'),
          api.get<FilterItem[]>('/company/business-industry'),
        ]);

        const provList = provRes.data || [];
        setProvinces(provList);
        setBusinessTypes(btRes.data || []);
        setBusinessIndustries(biRes.data || []);

        if (taxCode) {
          const profileRes = await api.get<{ data: CompanyProfileResponse }>(`/company/${taxCode}/company-profile`);
          if (profileRes.data?.data) {
            const p = profileRes.data.data;

            const dkkdProv = provList.find((prov) => prov.name === p.provinceDKKD);
            if (dkkdProv) {
              setSelectedDkkdProvId(String(dkkdProv.id));
              const wardsRes = await api.get<Ward[]>(`/location/provinces/${dkkdProv.id}/wards`);
              setDkkdWards(wardsRes.data || []);
            }

            const hdkdProv = provList.find((prov) => prov.name === p.provinceHDKD);
            if (hdkdProv) {
              setSelectedHdkdProvId(String(hdkdProv.id));
              const wardsRes = await api.get<Ward[]>(`/location/provinces/${hdkdProv.id}/wards`);
              setHdkdWards(wardsRes.data || []);
            }

            const initialVals: CompanyInput = {
              business_name: p.companyName || '',
              foreign_business_name: p.foreignCompanyName || '',
              tax_code: p.taxCode || '',
              business_type: p.businessType || '',
              business_industry: p.businessIndustry || '',
              license_issue_date: p.licenseIssueDate ? formatToInputDate(p.licenseIssueDate) : '',
              license_registration_province: p.provinceDKKD || '',
              license_registration_ward: p.wardDKKD || '',
              license_registration_adress: p.addressDKKD || '',
              email: p.email || '',
              business_phone: p.businessPhone || '',
              representative_name: p.representativeName || '',
              representative_phone: p.representativePhone || '',
              business_operating_province: p.provinceHDKD || '',
              business_operating_ward: p.wardHDKD || '',
              business_operating_adress: p.addressHDKD || '',
              business_license_file_url: p.gpkdFile || '',
              other_document_file_url: p.gtkFile || '',
            };

            setInitialProfileData(initialVals);
            reset(initialVals);
          }
        }
      } catch (err) {
        console.error('Lỗi tải thông tin Profile doanh nghiệp:', err);
        toast.error('Không thể tải thông tin tài khoản doanh nghiệp');
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [taxCode, reset]);

  const handleDkkdProvinceChange = async (provId: string) => {
    setSelectedDkkdProvId(provId);
    setValue('license_registration_ward', '');
    if (!provId) {
      setDkkdWards([]);
      return;
    }
    try {
      const res = await api.get<Ward[]>(`/location/provinces/${provId}/wards`);
      setDkkdWards(res.data || []);
    } catch (err) {
      console.error('Lỗi tải phường xã ĐKKD:', err);
    }
  };

  const handleHdkdProvinceChange = async (provId: string) => {
    setSelectedHdkdProvId(provId);
    setValue('business_operating_ward', '');
    if (!provId) {
      setHdkdWards([]);
      return;
    }
    try {
      const res = await api.get<Ward[]>(`/location/provinces/${provId}/wards`);
      setHdkdWards(res.data || []);
    } catch (err) {
      console.error('Lỗi tải phường xã HDKD:', err);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'gpkd' | 'gtk') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước tài liệu tối đa là 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    if (fileType === 'gpkd') {
      setGpkdUploading(true);
      setGpkdProgress(10);
    } else {
      setGtkUploading(true);
      setGtkProgress(10);
    }

    try {
      const res = await api.post<{ data: { filePath: string } }>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          if (fileType === 'gpkd') {
            setGpkdProgress(percentCompleted);
          } else {
            setGtkProgress(percentCompleted);
          }
        },
      });

      if (res.data?.data?.filePath) {
        const filename = res.data.data.filePath.split('/').pop() || '';
        if (fileType === 'gpkd') {
          setValue('business_license_file_url', filename);
          toast.success('Tải lên Giấy phép ĐKKD thành công!');
        } else {
          setValue('other_document_file_url', filename);
          toast.success('Tải lên tài liệu khác thành công!');
        }
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Tải lên file thất bại';
      toast.error(msg);
    } finally {
      if (fileType === 'gpkd') {
        setGpkdUploading(false);
      } else {
        setGtkUploading(false);
      }
    }
  };

  const handleCancel = async () => {
    if (!initialProfileData) return;
    setIsLoading(true);
    try {
      const dkkdProv = provinces.find((p) => p.name === initialProfileData.license_registration_province);
      if (dkkdProv) {
        const wardsRes = await api.get<Ward[]>(`/location/provinces/${dkkdProv.id}/wards`);
        setDkkdWards(wardsRes.data || []);
      }
      const hdkdProv = provinces.find((p) => p.name === initialProfileData.business_operating_province);
      if (hdkdProv) {
        const wardsRes = await api.get<Ward[]>(`/location/provinces/${hdkdProv.id}/wards`);
        setHdkdWards(wardsRes.data || []);
      }
      reset(initialProfileData);
      toast.success('Đã khôi phục dữ liệu ban đầu!');
    } catch (err) {
      console.error('Lỗi khôi phục thông tin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CompanyInput) => {
    setIsSaving(true);
    try {
      const formatToBEDate = (dateStr: string | null | undefined): string | null => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
      };

      const payload = {
        business_name: data.business_name,
        foreign_business_name: data.foreign_business_name || null,
        license_issue_date: data.license_issue_date ? formatToBEDate(data.license_issue_date) : null,
        license_registration_province: data.license_registration_province,
        license_registration_ward: data.license_registration_ward,
        license_registration_adress: data.license_registration_adress || null,
        business_phone: data.business_phone || null,
        representative_name: data.representative_name || null,
        representative_phone: data.representative_phone || null,
        business_operating_province: data.business_operating_province || null,
        business_operating_ward: data.business_operating_ward || null,
        business_operating_adress: data.business_operating_adress || null,
        business_license_file_url: data.business_license_file_url,
        other_document_file_url: data.other_document_file_url || null,
        business_type: data.business_type,
        business_industry: data.business_industry,
      };

      await api.patch(`/company/${taxCode}`, payload);
      toast.success('Cập nhật hồ sơ doanh nghiệp thành công!');
      setInitialProfileData(data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const backendMessage = axiosError.response?.data?.message;
      const msg = Array.isArray(backendMessage) ? backendMessage[0] : (backendMessage || 'Cập nhật thất bại');
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestChangeEmail = async () => {
    setShowChangeEmailModal(true);
    setEmailStep(1);
    setOtpCode('');
    setNewEmail('');
    setEmailTimer(60);
    setIsEmailLoading(true);

    try {
      await api.post(`/company/${taxCode}/change-email/request`);
      toast.success('Mã xác thực đã được gửi về email hiện tại của doanh nghiệp!');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Không thể gửi yêu cầu thay đổi email';
      toast.error(msg);
      setShowChangeEmailModal(false);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleOtpConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error('Vui lòng nhập đúng mã OTP gồm 6 chữ số');
      return;
    }
    setEmailStep(2);
  };

  const handleEmailConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim();

    if (!cleanEmail) {
      toast.error('Vui lòng nhập địa chỉ email mới');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      toast.error('Email mới không đúng định dạng');
      return;
    }
    if (cleanEmail.toLowerCase() === currentEmail?.toLowerCase()) {
      toast.error('Email mới không được trùng với email hiện tại');
      return;
    }

    setIsEmailLoading(true);
    try {
      await api.post(`/company/${taxCode}/change-email/confirm`, {
        otp: otpCode.trim(),
        newEmail: cleanEmail,
      });

      toast.success('Thay đổi email liên hệ thành công!');
      setValue('email', cleanEmail);
      setShowChangeEmailModal(false);
      setOtpCode('');
      setNewEmail('');
      setEmailStep(1);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Đổi email thất bại';
      toast.error(msg);
    } finally {
      setIsEmailLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F4F6F9] min-h-screen">
        <div className="text-sm font-medium text-gray-500 animate-pulse">
          Đang tải thông tin hồ sơ doanh nghiệp...
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans text-xs">
        
        <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Tài khoản</span>
            <span className="text-xs text-gray-400">❯</span>
            <h1 className="text-sm font-bold text-gray-900">Hồ sơ doanh nghiệp</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 cursor-pointer shadow-sm transition-colors"
            >
              Hủy bỏ thay đổi
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-blue-400 cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            
            <div>
              <h3 className="text-xs font-bold text-blue-600 border-b border-gray-150 pb-2 mb-4 tracking-wide select-none">
                1. Thông tin pháp lý & ĐKKD
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                
                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Tên doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('business_name')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.business_name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    } text-gray-800`}
                  />
                  {errors.business_name && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.business_name.message}</span>
                  )}
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Mã số thuế
                  </label>
                  <input
                    {...register('tax_code')}
                    type="text"
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-400 rounded-md cursor-not-allowed focus:outline-none font-mono"
                  />
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Tên nước ngoài
                  </label>
                  <input
                    {...register('foreign_business_name')}
                    type="text"
                    maxLength={255}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-gray-800"
                  />
                  {errors.foreign_business_name && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.foreign_business_name.message}</span>
                  )}
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Ngày cấp GPKD
                  </label>
                  <input
                    {...register('license_issue_date')}
                    type="date"
                    max={new Date().toLocaleDateString('en-CA')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none bg-white text-gray-900 font-medium ${
                      errors.license_issue_date ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.license_issue_date && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.license_issue_date.message}</span>
                  )}
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Loại hình doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={businessTypes.map((t) => ({ value: t.name, label: t.name }))}
                    value={watch('business_type')}
                    onChange={(val) => setValue('business_type', val, { shouldValidate: true })}
                    placeholder="Chọn loại hình"
                  />
                  {errors.business_type && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.business_type.message}</span>
                  )}
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Ngành nghề kinh doanh chính <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={businessIndustries.map((i) => ({ value: i.name, label: i.code ? `${i.code} - ${i.name}` : i.name }))}
                    value={watch('business_industry')}
                    onChange={(val) => setValue('business_industry', val, { shouldValidate: true })}
                    placeholder="Chọn ngành nghề chính"
                  />
                  {errors.business_industry && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.business_industry.message}</span>
                  )}
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Tỉnh/thành ĐKKD <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={provinces.map((p) => ({ value: p.name, label: p.name }))}
                    value={watch('license_registration_province')}
                    onChange={(val) => {
                      setValue('license_registration_province', val, { shouldValidate: true });
                      const matched = provinces.find((p) => p.name === val);
                      handleDkkdProvinceChange(matched ? String(matched.id) : '');
                    }}
                    placeholder="Chọn tỉnh ĐKKD"
                  />
                  {errors.license_registration_province && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.license_registration_province.message}</span>
                  )}
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Phường/xã ĐKKD <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={dkkdWards.map((w) => ({ value: w.name, label: w.name }))}
                    value={watch('license_registration_ward')}
                    onChange={(val) => setValue('license_registration_ward', val, { shouldValidate: true })}
                    placeholder="Chọn phường xã ĐKKD"
                    disabled={!selectedDkkdProvId}
                  />
                  {errors.license_registration_ward && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.license_registration_ward.message}</span>
                  )}
                </div>

                <div className="md:col-span-2 relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Địa chỉ chi tiết ĐKKD
                  </label>
                  <input
                    {...register('license_registration_adress')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-gray-800"
                  />
                </div>

              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-blue-600 border-b border-gray-150 pb-2 mb-4 tracking-wide select-none">
                2. Thông tin liên hệ & HĐKD
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                
                <div className="relative mt-1 flex gap-2 items-center">
                  <div className="relative flex-1">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                      Email doanh nghiệp
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-400 rounded-md cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestChangeEmail}
                    className="px-3.5 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                  >
                    Thay đổi
                  </button>
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Điện thoại doanh nghiệp
                  </label>
                  <input
                    {...register('business_phone')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.business_phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    } text-gray-800`}
                  />
                  {errors.business_phone && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.business_phone.message}</span>
                  )}
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Họ tên người đại diện pháp luật
                  </label>
                  <input
                    {...register('representative_name')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.representative_name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    } text-gray-800`}
                  />
                  {errors.representative_name && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.representative_name.message}</span>
                  )}
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Điện thoại người đại diện
                  </label>
                  <input
                    {...register('representative_phone')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.representative_phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    } text-gray-800`}
                  />
                  {errors.representative_phone && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.representative_phone.message}</span>
                  )}
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Tỉnh/thành hoạt động
                  </label>
                  <SearchableSelect
                    options={provinces.map((p) => ({ value: p.name, label: p.name }))}
                    value={watch('business_operating_province') || ''}
                    onChange={(val) => {
                      setValue('business_operating_province', val);
                      const matched = provinces.find((p) => p.name === val);
                      handleHdkdProvinceChange(matched ? String(matched.id) : '');
                    }}
                    placeholder="Chọn tỉnh hoạt động"
                  />
                </div>

                <div className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Phường/xã hoạt động
                  </label>
                  <SearchableSelect
                    options={hdkdWards.map((w) => ({ value: w.name, label: w.name }))}
                    value={watch('business_operating_ward') || ''}
                    onChange={(val) => setValue('business_operating_ward', val)}
                    placeholder="Chọn phường xã hoạt động"
                    disabled={!selectedHdkdProvId}
                  />
                </div>

                <div className="md:col-span-2 relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                    Địa chỉ chi tiết hoạt động
                  </label>
                  <input
                    {...register('business_operating_adress')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-gray-800"
                  />
                </div>

              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-blue-600 border-b border-gray-150 pb-2 mb-4 tracking-wide select-none">
                3. Tài liệu đính kèm
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-semibold">
                    Giấy phép đăng ký kinh doanh (PDF, Ảnh) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputGpkdRef.current?.click()}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
                    >
                      {businessLicenseFileUrlVal ? 'Thay đổi file' : 'Chọn file tải lên'}
                    </button>
                    <input
                      type="file"
                      ref={fileInputGpkdRef}
                      onChange={(e) => handleUploadFile(e, 'gpkd')}
                      accept=".pdf, image/*"
                      className="hidden"
                    />
                    {businessLicenseFileUrlVal && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-semibold truncate max-w-[200px]" title={businessLicenseFileUrlVal}>
                          ✓ {businessLicenseFileUrlVal}
                        </span>
                        <a
                          href={businessLicenseFileUrlVal.startsWith('http') ? businessLicenseFileUrlVal : `http://localhost:8080/uploads/${businessLicenseFileUrlVal}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-bold"
                        >
                          Xem file
                        </a>
                      </div>
                    )}
                  </div>
                  {gpkdUploading && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${gpkdProgress}%` }} />
                    </div>
                  )}
                  {errors.business_license_file_url && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.business_license_file_url.message}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-semibold">
                    Tài liệu bổ sung khác (nếu có)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputGtkRef.current?.click()}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
                    >
                      {otherDocumentFileUrlVal ? 'Thay đổi file' : 'Chọn file tải lên'}
                    </button>
                    <input
                      type="file"
                      ref={fileInputGtkRef}
                      onChange={(e) => handleUploadFile(e, 'gtk')}
                      accept=".pdf, image/*"
                      className="hidden"
                    />
                    {otherDocumentFileUrlVal && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-semibold truncate max-w-[200px]" title={otherDocumentFileUrlVal}>
                          ✓ {otherDocumentFileUrlVal}
                        </span>
                        <a
                          href={otherDocumentFileUrlVal.startsWith('http') ? otherDocumentFileUrlVal : `http://localhost:8080/uploads/${otherDocumentFileUrlVal}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-bold"
                        >
                          Xem file
                        </a>
                      </div>
                    )}
                  </div>
                  {gtkUploading && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${gtkProgress}%` }} />
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>

      </form>

      {showChangeEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl p-8 text-gray-700 animate-fadeIn">
            <div className="text-[#2F6BFF] font-bold text-lg tracking-wider text-center w-full block mb-4 uppercase">
              THAY ĐỔI EMAIL LIÊN HỆ
            </div>

            {emailStep === 1 ? (
              <form onSubmit={handleOtpConfirm} className="space-y-5" noValidate>
                <div className="text-xs text-gray-600 text-center space-y-1 leading-relaxed">
                  <p>Hệ thống đã gửi mã xác minh về hòm thư Email cũ:</p>
                  <p className="font-bold text-gray-900">{currentEmail || '...'}</p>
                  <p>Vui lòng điền mã OTP để tiếp tục</p>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-gray-400 z-10 select-none">
                    Nhập mã OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Mã OTP 6 chữ số"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-center text-sm font-bold tracking-widest text-gray-800"
                  />
                </div>

                <div className="text-center">
                  {isEmailLoading ? (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[#2F6BFF]" />
                      <span>Đang gửi mã...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-[#2F6BFF] font-bold text-xs">
                        00:{emailTimer < 10 ? `0${emailTimer}` : emailTimer}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Chưa nhận được mã?{' '}
                        <button
                          type="button"
                          disabled={emailTimer > 0 || isEmailLoading}
                          onClick={async () => {
                            setIsEmailLoading(true);
                            try {
                              await api.post(`/company/${taxCode}/change-email/request`);
                              toast.success('Đã gửi lại mã OTP về email hiện tại!');
                              setEmailTimer(60);
                            } catch (err) {
                              toast.error('Gửi lại mã OTP thất bại');
                            } finally {
                              setIsEmailLoading(false);
                            }
                          }}
                          className={`font-bold transition-colors bg-transparent border-0 cursor-pointer ${
                            emailTimer > 0 || isEmailLoading ? 'text-gray-300' : 'text-blue-600 hover:underline'
                          }`}
                        >
                          Gửi lại
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2 pt-2 text-xs font-semibold">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg shadow-sm cursor-pointer"
                  >
                    Xác nhận mã OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowChangeEmailModal(false)}
                    className="w-full py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg text-center block cursor-pointer transition-colors"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEmailConfirmSave} className="space-y-5" noValidate>
                <div className="text-xs text-gray-500 text-center leading-relaxed">
                  Mã OTP cũ đã khớp. Vui lòng nhập email liên hệ mới cho tài khoản doanh nghiệp.
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-gray-400 z-10 select-none">
                    Email mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="example@doanhnghiep.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-xs text-gray-800"
                  />
                </div>

                <div className="space-y-2 pt-2 text-xs font-semibold">
                  <button
                    type="submit"
                    disabled={isEmailLoading}
                    className="w-full py-2.5 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:bg-blue-400 cursor-pointer"
                  >
                    {isEmailLoading ? 'Đang cập nhật...' : 'Cập nhật email'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangeEmailModal(false);
                      setEmailStep(1);
                    }}
                    className="w-full py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg text-center block cursor-pointer transition-colors"
                  >
                    Hủy bỏ
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
