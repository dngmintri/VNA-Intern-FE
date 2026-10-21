'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { api } from '@/libs/core/api/axios';
import { companySchema, CompanyInput } from '../../company/schemas/company.schema';
import { SearchableSelect } from '../../company/components/SearchableSelect';

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

export const RegisterForm = () => {
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const [otp, setOtp] = useState<string>('');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [registeredTaxCode, setRegisteredTaxCode] = useState<string>('');
  const [timer, setTimer] = useState<number>(60);
  const [isOtpResending, setIsOtpResending] = useState<boolean>(false);

  const fileInputGpkdRef = useRef<HTMLInputElement>(null);
  const fileInputGtkRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    mode: 'onTouched',
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    if (step !== 1) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [step]);

    useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [provRes, btRes, biRes] = await Promise.all([
          api.get<Province[]>('/location/provinces'),
          api.get<{ data?: FilterItem[] } & FilterItem[]>('/business-types/all'),
          api.get<{ data?: FilterItem[] } & FilterItem[]>('/business-industries/level/4?isActive=true'),
        ]);
        setProvinces(provRes.data || []);
        setBusinessTypes(btRes.data?.data || btRes.data || []);
        setBusinessIndustries(biRes.data?.data || biRes.data || []);
      } catch (err) {
        console.error('Lỗi tải dữ liệu danh mục:', err);
        toast.error('Không thể tải các danh mục hỗ trợ');
      }
    };
    fetchMetadata();
  }, []);

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

  const onRegisterSubmit = async (data: CompanyInput) => {
    setIsLoading(true);
    try {
      const formatToBEDate = (dateStr: string | null | undefined): string | null => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
      };

      const payload = {
        ...data,
        license_issue_date: data.license_issue_date ? formatToBEDate(data.license_issue_date) : null,
        foreign_business_name: data.foreign_business_name || null,
        business_phone: data.business_phone || null,
        representative_name: data.representative_name || null,
        representative_phone: data.representative_phone || null,
        business_operating_province: data.business_operating_province || null,
        business_operating_ward: data.business_operating_ward || null,
        business_operating_adress: data.business_operating_adress || null,
        other_document_file_url: data.other_document_file_url || null,
      };

      await api.post('/auth/register-company', payload);
      toast.success('Gửi yêu cầu đăng ký thành công! Vui lòng kiểm tra email nhận mã kích hoạt.');
      setRegisteredEmail(data.email);
      setRegisteredTaxCode(data.tax_code);
      setStep(2);
      setTimer(60);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const backendMessage = axiosError.response?.data?.message;
      const msg = Array.isArray(backendMessage)
        ? backendMessage[0]
        : (backendMessage || 'Đăng ký tài khoản doanh nghiệp thất bại');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterInvalid = (errors: FieldErrors<CompanyInput>) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      toast.error('Vui lòng nhập đúng mã OTP gồm 6 chữ số');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register-company/confirm', {
        email: registeredEmail,
        otp: otp.trim(),
      });
      toast.success('Kích hoạt tài khoản thành công!');
      setStep(3);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Xác thực mã OTP thất bại';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsOtpResending(true);
    try {
      toast.success('Đã gửi lại mã kích hoạt về email của bạn!');
      setTimer(60);
    } catch (err) {
      toast.error('Gửi lại mã kích hoạt thất bại');
    } finally {
      setIsOtpResending(false);
    }
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText('12345678');
      toast.success('Đã sao chép mật khẩu mặc định (12345678) vào clipboard!');
    } catch (err) {
    }
  };

  return (
    <div
      className={`min-h-full flex-1 w-full flex items-center justify-center bg-gray-50 py-4 sm:py-6 px-4 sm:px-6 lg:px-8 select-none font-sans ${step !== 1 ? 'auth-layout' : ''}`}
      {...(step !== 1 ? { 'data-nobar': 'true' } : {})}
    >
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-xl w-full py-4 px-5 sm:px-6 transition-all ${
        step === 1 ? 'max-w-4xl' : 'max-w-md'
      }`}>
        
        <div className="flex flex-col items-center justify-center text-center mb-3 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide leading-snug">
            ĐĂNG KÝ TÀI KHOẢN DOANH NGHIỆP NGOÀI
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">
            Hệ thống An toàn Vệ sinh Lao động
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSubmit(onRegisterSubmit, onRegisterInvalid)} className="space-y-4.5">
            
            <div>
              <h3 className="text-xs font-bold text-blue-600 border-b border-gray-150 pb-1.5 mb-2.5 tracking-wide select-none">
                1. Thông tin pháp lý & ĐKKD
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                
                <div id="field-business_name" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Tên doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('business_name')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.business_name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    } text-gray-800`}
                  />
                  {errors.business_name && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.business_name.message}</span>
                  )}
                </div>

                <div id="field-tax_code" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Mã số thuế <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('tax_code')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.tax_code ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    } text-gray-800 font-mono`}
                  />
                  {errors.tax_code && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.tax_code.message}</span>
                  )}
                </div>

                <div id="field-foreign_business_name" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Tên nước ngoài
                  </label>
                  <input
                    {...register('foreign_business_name')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-800"
                  />
                </div>

                <div id="field-license_issue_date" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Ngày cấp GPKD
                  </label>
                  <input
                    {...register('license_issue_date')}
                    type="date"
                    max={new Date().toLocaleDateString('en-CA')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none bg-white text-gray-900 font-medium ${
                      errors.license_issue_date ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {errors.license_issue_date && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.license_issue_date.message}</span>
                  )}
                </div>

                <div id="field-business_type" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Loại hình doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={businessTypes.map((t) => ({ value: t.name, label: t.name }))}
                    value={watch('business_type')}
                    onChange={(val) => setValue('business_type', val, { shouldValidate: true })}
                    placeholder=""
                  />
                  {errors.business_type && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.business_type.message}</span>
                  )}
                </div>

                <div id="field-business_industry" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Ngành nghề kinh doanh chính <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={businessIndustries.map((i) => ({ value: i.name, label: i.code ? `${i.code} - ${i.name}` : i.name }))}
                    value={watch('business_industry')}
                    onChange={(val) => setValue('business_industry', val, { shouldValidate: true })}
                    placeholder=""
                  />
                  {errors.business_industry && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.business_industry.message}</span>
                  )}
                </div>

                <div id="field-license_registration_province" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
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
                    placeholder=""
                  />
                  {errors.license_registration_province && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.license_registration_province.message}</span>
                  )}
                </div>

                <div id="field-license_registration_ward" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Phường/xã ĐKKD <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={dkkdWards.map((w) => ({ value: w.name, label: w.name }))}
                    value={watch('license_registration_ward')}
                    onChange={(val) => setValue('license_registration_ward', val, { shouldValidate: true })}
                    placeholder=""
                    disabled={!selectedDkkdProvId}
                  />
                  {errors.license_registration_ward && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.license_registration_ward.message}</span>
                  )}
                </div>

                <div id="field-license_registration_adress" className="md:col-span-2 relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Địa chỉ chi tiết ĐKKD
                  </label>
                  <input
                    {...register('license_registration_adress')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-800"
                  />
                </div>

              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-blue-600 border-b border-gray-150 pb-1.5 mb-2.5 tracking-wide select-none">
                2. Thông tin liên hệ & HĐKD
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                
                <div id="field-email" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Email nhận tài khoản <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    } text-gray-800`}
                  />
                  {errors.email && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.email.message}</span>
                  )}
                </div>

                <div id="field-business_phone" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Điện thoại doanh nghiệp
                  </label>
                  <input
                    {...register('business_phone')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.business_phone ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    } text-gray-800`}
                  />
                  {errors.business_phone && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.business_phone.message}</span>
                  )}
                </div>

                <div id="field-representative_name" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Họ tên người đại diện pháp luật
                  </label>
                  <input
                    {...register('representative_name')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.representative_name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    } text-gray-800`}
                  />
                  {errors.representative_name && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.representative_name.message}</span>
                  )}
                </div>

                <div id="field-representative_phone" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Điện thoại người đại diện
                  </label>
                  <input
                    {...register('representative_phone')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      errors.representative_phone ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    } text-gray-800`}
                  />
                  {errors.representative_phone && (
                    <span className="text-[9.5px] text-red-500 mt-1 block font-semibold">{errors.representative_phone.message}</span>
                  )}
                </div>

                <div id="field-business_operating_province" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
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
                    placeholder=""
                  />
                </div>

                <div id="field-business_operating_ward" className="relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Phường/xã hoạt động
                  </label>
                  <SearchableSelect
                    options={hdkdWards.map((w) => ({ value: w.name, label: w.name }))}
                    value={watch('business_operating_ward') || ''}
                    onChange={(val) => setValue('business_operating_ward', val)}
                    placeholder=""
                    disabled={!selectedHdkdProvId}
                  />
                </div>

                <div id="field-business_operating_adress" className="md:col-span-2 relative mt-1">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                    Địa chỉ chi tiết hoạt động
                  </label>
                  <input
                    {...register('business_operating_adress')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-800"
                  />
                </div>

              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-blue-600 border-b border-gray-150 pb-1.5 mb-2.5 tracking-wide select-none">
                3. Tài liệu đính kèm
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div id="field-business_license_file_url" className="space-y-1.5">
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
                      <span className="text-emerald-600 font-semibold truncate max-w-[200px]" title={businessLicenseFileUrlVal}>
                        ✓ {businessLicenseFileUrlVal}
                      </span>
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

                <div id="field-other_document_file_url" className="space-y-1.5">
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
                      <span className="text-emerald-600 font-semibold truncate max-w-[200px]" title={otherDocumentFileUrlVal}>
                        ✓ {otherDocumentFileUrlVal}
                      </span>
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

            <div className="flex items-center justify-end gap-3.5 border-t border-gray-150 pt-3.5 mt-4 sticky bottom-0 bg-white z-20 pb-2 shadow-[0_-6px_10px_-4px_rgba(0,0,0,0.05)]">
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                Quay lại Đăng nhập
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-blue-400 cursor-pointer flex items-center gap-1.5"
              >
                {isLoading ? 'Đang gửi...' : 'Đăng ký doanh nghiệp'}
              </button>
            </div>

          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleConfirmOtp} className="space-y-6">
            <div className="text-xs text-gray-600 text-center space-y-1 leading-relaxed">
              <p>Hệ thống đã gửi mã kích hoạt tài khoản qua Email của bạn</p>
              <p className="font-bold text-gray-900">{registeredEmail}</p>
              <p>Vui lòng điền mã OTP gồm 6 chữ số để kích hoạt tài khoản</p>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-gray-400 select-none z-10">
                Mã xác thực OTP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-center text-sm font-bold tracking-widest text-gray-900"
              />
            </div>

            <div className="text-center">
              {isOtpResending ? (
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-450">
                  <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <>
                  <div className="text-blue-600 font-bold text-xs">
                    00:{timer < 10 ? `0${timer}` : timer}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Chưa nhận được mã?{' '}
                    <button
                      type="button"
                      disabled={timer > 0 || isOtpResending}
                      onClick={handleResendOtp}
                      className={`font-bold transition-colors bg-transparent border-0 cursor-pointer ${
                        timer > 0 || isOtpResending ? 'text-gray-300' : 'text-blue-600 hover:underline'
                      }`}
                    >
                      Gửi lại
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-755 text-white rounded-lg font-semibold text-xs shadow-sm transition-colors disabled:bg-blue-400 cursor-pointer"
              >
                {isLoading ? 'Đang xác thực...' : 'Xác thực kích hoạt'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-semibold text-gray-500 text-center hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Quay lại chỉnh sửa thông tin
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 mb-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-gray-900">Kích hoạt tài khoản thành công!</h3>
              <p className="text-[11px] text-gray-400 leading-normal">
                Tài khoản doanh nghiệp ngoài của bạn đã hoạt động và sẵn sàng đăng nhập.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <span className="text-[10px] font-semibold text-gray-400 block mb-1">Tên đăng nhập (Mã số thuế)</span>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-800">
                  {registeredTaxCode}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-gray-400 block mb-1">Mật khẩu mặc định khởi tạo</span>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
                  <input
                    type="text"
                    readOnly
                    value="12345678"
                    className="w-full px-3 py-2 text-xs font-bold text-gray-800 bg-transparent focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 text-[#2F6BFF] hover:text-blue-700 text-[10px] font-bold h-full hover:bg-gray-150 transition-colors cursor-pointer border-l border-gray-200 bg-white"
                  >
                    Sao chép
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-[10.5px] text-blue-700 leading-relaxed text-left">
              <span className="font-bold">Khuyến cáo:</span> Sau khi đăng nhập thành công bằng mật khẩu mặc định trên, bạn vui lòng tiến hành thay đổi mật khẩu ngay để bảo mật hồ sơ doanh nghiệp.
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-colors text-center block cursor-pointer"
              >
                Đi đến trang Đăng nhập
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
