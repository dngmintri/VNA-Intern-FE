'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { api } from '@/libs/core/api/axios';
import { useAuthStore } from '@/libs/tts/store/auth.store';
import { decodeJwt } from '@/libs/shared/utils/jwt';
import { companySchema, CompanyInput } from '../schemas/company.schema';
import { BusinessType, BusinessIndustry } from '../interfaces/company.interface';
import { SearchableSelect } from './SearchableSelect';
import { FilePreviewModal } from './FilePreviewModal';

const formatToBEDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
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

const formatDisplayDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  let normalized = dateStr;
  if (normalized.includes('T')) {
    normalized = normalized.split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split('-');
    return `${day}/${month}/${year}`;
  }
  const sep = normalized.includes('/') ? '/' : '-';
  const parts = normalized.split(sep);
  if (parts.length === 3 && parts[0].length === 4) {
    const [first, second, third] = parts;
    return `${third}/${second}/${first}`;
  }
  if (parts.length === 3) {
    const [first, second, third] = parts;
    return `${first}/${second}/${third}`;
  }
  return normalized;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Province {
  id: number;
  name: string;
}

interface Ward {
  id: number;
  name: string;
  provinceId: number;
}

export const CompanyProfileForm = () => {
  const { accessToken } = useAuthStore();
  const decoded = accessToken ? decodeJwt(accessToken) : null;
  const taxCode = decoded?.username || '';

  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [initialProfileData, setInitialProfileData] = useState<CompanyInput | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [businessIndustries, setBusinessIndustries] = useState<BusinessIndustry[]>([]);

  const [dkkdWards, setDkkdWards] = useState<Ward[]>([]);
  const [hdkdWards, setHdkdWards] = useState<Ward[]>([]);

  const [selectedDkkdProvId, setSelectedDkkdProvId] = useState<string>('');
  const [selectedHdkdProvId, setSelectedHdkdProvId] = useState<string>('');

  const [gpkdUploading, setGpkdUploading] = useState<boolean>(false);
  const [gpkdProgress, setGpkdProgress] = useState<number>(0);
  const [gtkUploading, setGtkUploading] = useState<boolean>(false);
  const [gtkProgress, setGtkProgress] = useState<number>(0);

  const [previewData, setPreviewData] = useState<Record<string, string | null>>({});
  const [previewModalFile, setPreviewModalFile] = useState<{ url: string; name: string } | null>(null);

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
    getValues,
    formState: { errors },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      business_name: '',
      foreign_business_name: '',
      tax_code: '',
      business_type: '',
      business_industry: '',
      license_issue_date: '',
      license_registration_province: '',
      license_registration_ward: '',
      license_registration_adress: '',
      email: '',
      business_phone: '',
      business_operating_province: '',
      business_operating_ward: '',
      business_operating_adress: '',
      representative_name: '',
      representative_phone: '',
      business_license_file_url: '',
      other_document_file_url: '',
    },
  });

  const gpkdFileVal = watch('business_license_file_url');
  const gtkFileVal = watch('other_document_file_url');
  const watchedBusinessIndustry = watch('business_industry');
  const watchedDkkdProv = watch('license_registration_province');
  const watchedDkkdWard = watch('license_registration_ward');
  const watchedHdkdProv = watch('business_operating_province');
  const watchedHdkdWard = watch('business_operating_ward');
  const currentEmail = watch('email');

  const getFileUrl = (filePath: string | null | undefined): string => {
    if (!filePath || filePath === 'none') return '';
    if (filePath.startsWith('http')) return filePath;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}${filePath.startsWith('/') ? '' : '/uploads/documents/'}${filePath}`;
  };

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
          api.get<{ data?: BusinessType[] } & BusinessType[]>('/business-types/all').catch(() => api.get<BusinessType[]>('/company/business-type')),
          api.get<{ data?: BusinessIndustry[] } & BusinessIndustry[]>('/business-industries/level/4?isActive=true').catch(() => api.get<BusinessIndustry[]>('/company/business-industry')),
        ]);

        const provList = provRes.data || [];
        setProvinces(provList);
        const btData: any = btRes.data;
        const biData: any = biRes.data;
        setBusinessTypes(Array.isArray(btData?.data) ? btData.data : (Array.isArray(btData) ? btData : []));
        setBusinessIndustries(Array.isArray(biData?.data) ? biData.data : (Array.isArray(biData) ? biData : []));

        let effectiveTaxCode = taxCode;
        if (!effectiveTaxCode) {
          try {
            const userProfileRes = await api.get<{ data?: any } & any>('/users/profile');
            const uData = userProfileRes.data?.data || userProfileRes.data;
            if (uData?.username) {
              effectiveTaxCode = uData.username;
            } else if (uData?.businessId) {
              effectiveTaxCode = uData.businessId;
            }
          } catch (e) {
            console.error('Không thể lấy thông tin user profile:', e);
          }
        }

        if (effectiveTaxCode) {
          let p: any = null;
          try {
            const res = await api.get<{ data?: any } & any>(`/business/${effectiveTaxCode}`);
            p = res.data?.data || res.data;
          } catch {
            try {
              const profileRes = await api.get<{ data: any }>(`/company/${effectiveTaxCode}/company-profile`);
              p = profileRes.data?.data || profileRes.data;
            } catch {
              const searchRes = await api.get<{ data?: { items: any[] } } & any>(`/business?search=${effectiveTaxCode}`);
              const items = searchRes.data?.data?.items || searchRes.data?.items || [];
              p = items.find((item: any) => item.taxCode === effectiveTaxCode) || items[0];
            }
          }

          if (p) {
            if (p.id) setCompanyId(String(p.id));

            const regProv = p.registeredProvince || p.provinceDKKD;
            const regWard = p.registeredDistrict || p.wardDKKD;
            const opProv = p.operatingProvince || p.provinceHDKD;
            const opWard = p.operatingDistrict || p.wardHDKD;

            const dkkdProv = provList.find((prov) => prov.name === regProv);
            if (dkkdProv) {
              setSelectedDkkdProvId(String(dkkdProv.id));
              const wardsRes = await api.get<Ward[]>(`/location/provinces/${dkkdProv.id}/wards`);
              setDkkdWards(wardsRes.data || []);
            }

            const hdkdProv = provList.find((prov) => prov.name === opProv);
            if (hdkdProv) {
              setSelectedHdkdProvId(String(hdkdProv.id));
              const wardsRes = await api.get<Ward[]>(`/location/provinces/${hdkdProv.id}/wards`);
              setHdkdWards(wardsRes.data || []);
            }

            const initialVals: CompanyInput = {
              business_name: p.name || p.companyName || '',
              foreign_business_name: p.foreignName || p.foreignCompanyName || '',
              tax_code: p.taxCode || taxCode,
              business_type: p.businessType?.name || p.businessTypeId || p.businessType || '',
              business_industry: p.businessIndustry?.name || p.businessIndustryId || p.businessIndustry || '',
              license_issue_date: (p.licenseDate || p.licenseIssueDate) ? formatToInputDate(p.licenseDate || p.licenseIssueDate) : '',
              license_registration_province: regProv || '',
              license_registration_ward: regWard || '',
              license_registration_adress: p.address || p.addressDKKD || '',
              email: p.email || '',
              business_phone: p.officePhone || p.businessPhone || '',
              business_operating_province: opProv || '',
              business_operating_ward: opWard || '',
              business_operating_adress: p.businessLocation || p.addressHDKD || '',
              representative_name: p.representativeName || '',
              representative_phone: p.representativePhone || '',
              business_license_file_url: p.gpkdFilePath || p.gpkdFile || '',
              other_document_file_url: p.otherDocumentPath || p.gtkFile || '',
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

  const handleDkkdProvinceChange = async (provName: string) => {
    if (!provName) {
      setDkkdWards([]);
      setValue('license_registration_ward', '');
      return;
    }

    const matchedProv = provinces.find((p) => p.name === provName);
    if (!matchedProv) return;

    setSelectedDkkdProvId(String(matchedProv.id));
    try {
      const response = await api.get<Ward[]>(`/location/provinces/${matchedProv.id}/wards`);
      setDkkdWards(response.data || []);
      setValue('license_registration_ward', '');
    } catch (err) {
      console.error('Lỗi tải danh sách xã phường:', err);
    }
  };

  const handleHdkdProvinceChange = async (provName: string) => {
    if (!provName) {
      setHdkdWards([]);
      setValue('business_operating_ward', '');
      return;
    }

    const matchedProv = provinces.find((p) => p.name === provName);
    if (!matchedProv) return;

    setSelectedHdkdProvId(String(matchedProv.id));
    try {
      const response = await api.get<Ward[]>(`/location/provinces/${matchedProv.id}/wards`);
      setHdkdWards(response.data || []);
      setValue('business_operating_ward', '');
    } catch (err) {
      console.error('Lỗi tải danh sách xã phường:', err);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'gpkd' | 'gtk') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.doc', '.docx', '.pdf'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      toast.error('Chỉ cho phép tải lên file hình ảnh (PNG, JPG, WEBP), Word (.DOC, .DOCX) hoặc PDF!');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước tài liệu tối đa là 10MB');
      e.target.value = '';
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
      setStep(1);
      toast.success('Đã khôi phục dữ liệu ban đầu!');
    } catch (err) {
      console.error('Lỗi khôi phục thông tin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = (errors: FieldErrors<CompanyInput>) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const onSubmit = async (data: CompanyInput) => {
    const matchedBt = businessTypes.find(bt => String(bt.id) === data.business_type || bt.code === data.business_type || bt.name === data.business_type);
    const matchedBi = businessIndustries.find(bi => String(bi.id) === data.business_industry || bi.code === data.business_industry || bi.name === data.business_industry);

    setPreviewData({
      companyName: data.business_name,
      taxCode: data.tax_code,
      foreignCompanyName: data.foreign_business_name || null,
      businessType: matchedBt ? matchedBt.name : data.business_type,
      businessIndustry: matchedBi ? (matchedBi.code ? `${matchedBi.code} - ${matchedBi.name}` : matchedBi.name) : data.business_industry,
      licenseIssueDate: data.license_issue_date || null,
      addressDKKD: data.license_registration_adress || '',
      wardDKKD: data.license_registration_ward || '',
      provinceDKKD: data.license_registration_province || '',
      email: data.email,
      businessPhone: data.business_phone || null,
      representativeName: data.representative_name || null,
      representativePhone: data.representative_phone || null,
      addressHDKD: data.business_operating_adress || '',
      wardHDKD: data.business_operating_ward || '',
      provinceHDKD: data.business_operating_province || '',
      gpkdFile: data.business_license_file_url && data.business_license_file_url !== 'none' ? data.business_license_file_url : null,
      gtkFile: data.other_document_file_url || null,
    });
    setStep(2);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    const data = getValues();
    const matchedBt = businessTypes.find(bt => String(bt.id) === data.business_type || bt.code === data.business_type || bt.name === data.business_type);
    const matchedBi = businessIndustries.find(bi => String(bi.id) === data.business_industry || bi.code === data.business_industry || bi.name === data.business_industry);

    const updatePayload = {
      name: data.business_name.trim(),
      taxCode: data.tax_code.trim(),
      businessTypeId: matchedBt ? String(matchedBt.id) : (businessTypes[0]?.id ? String(businessTypes[0].id) : undefined),
      businessIndustryId: matchedBi ? String(matchedBi.id) : (businessIndustries[0]?.id ? String(businessIndustries[0].id) : undefined),
      licenseDate: data.license_issue_date ? formatToBEDate(data.license_issue_date) : null,
      registeredProvince: data.license_registration_province || null,
      registeredDistrict: data.license_registration_ward || null,
      address: data.license_registration_adress || null,
      foreignName: data.foreign_business_name || null,
      email: data.email.trim(),
      officePhone: data.business_phone || null,
      operatingProvince: data.business_operating_province || null,
      operatingDistrict: data.business_operating_ward || null,
      businessLocation: data.business_operating_adress || null,
      representativeName: data.representative_name || null,
      representativePhone: data.representative_phone || null,
      gpkdFilePath: data.business_license_file_url && data.business_license_file_url !== 'none' ? data.business_license_file_url : null,
      otherDocumentPath: data.other_document_file_url || null,
    };

    const targetId = companyId || taxCode;
    try {
      try {
        await api.patch(`/business/${targetId}`, updatePayload);
      } catch {
        const legacyPayload = {
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
        await api.patch(`/company/${taxCode}`, legacyPayload);
      }

      toast.success('Cập nhật hồ sơ doanh nghiệp thành công!');
      setInitialProfileData(data);
      setStep(1);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const backendMessage = axiosError.response?.data?.message;
      const msg = Array.isArray(backendMessage) ? backendMessage[0] : (backendMessage || 'Cập nhật thất bại. Vui lòng kiểm tra lại!');
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
      try {
        const res = await api.post('/users/email/change/request');
        const devOtp = res.data?.data?.devOtp || res.data?.devOtp;
        if (devOtp) {
          toast.success(`Mã OTP (Dev mode): ${devOtp}`, { duration: 10000 });
        } else {
          toast.success('Mã xác thực đã được gửi về email hiện tại của doanh nghiệp!');
        }
      } catch {
        await api.post(`/company/${taxCode}/change-email/request`);
        toast.success('Mã xác thực đã được gửi về email hiện tại của doanh nghiệp!');
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Không thể gửi yêu cầu thay đổi email';
      toast.error(msg);
      setShowChangeEmailModal(false);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsEmailLoading(true);
    try {
      try {
        const res = await api.post('/users/email/change/request');
        const devOtp = res.data?.data?.devOtp || res.data?.devOtp;
        if (devOtp) {
          toast.success(`Mã OTP mới (Dev mode): ${devOtp}`, { duration: 10000 });
        } else {
          toast.success('Mã xác minh mới đã được gửi qua email cũ!');
        }
      } catch {
        await api.post(`/company/${taxCode}/change-email/request`);
        toast.success('Mã xác minh mới đã được gửi qua email cũ!');
      }
      setEmailTimer(60);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không thể gửi lại mã xác minh');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleOtpConfirm = async (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error('Mã OTP không chính xác, vui lòng kiểm tra lại');
      return;
    }
    setIsEmailLoading(true);
    try {
      await api.post('/users/email/change/verify-otp', { otp: otpCode.trim() });
      toast.success('Mã xác thực hợp lệ! Vui lòng nhập email mới.');
      setEmailStep(2);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const backendMessage = axiosError.response?.data?.message;
      const msg = Array.isArray(backendMessage)
        ? backendMessage[0]
        : (backendMessage || 'Mã OTP không chính xác, vui lòng kiểm tra lại');
      toast.error(msg === 'OTP không chính xác' ? 'Mã OTP không chính xác, vui lòng kiểm tra lại' : msg);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailConfirmSave = async (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = newEmail.trim();

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      toast.error('Email không hợp lệ , vui lòng kiểm tra lại dữ liệu');
      return;
    }
    if (cleanEmail.toLowerCase() === currentEmail?.toLowerCase()) {
      toast.error('Email mới không được trùng email hiện tại , vui lòng kiểm tra lại dữ liệu');
      return;
    }

    setIsEmailLoading(true);
    try {
      try {
        await api.patch('/users/email/change', {
          newEmail: cleanEmail,
          otp: otpCode.trim(),
        });
      } catch (patchErr: unknown) {
        const patchAxiosError = patchErr as AxiosError<{ message?: string | string[] }>;
        const status = patchAxiosError.response?.status;
        const patchMsg = patchAxiosError.response?.data?.message;
        const msgStr = Array.isArray(patchMsg) ? patchMsg[0] : (patchMsg || '');

        if (
          status === 409 ||
          status === 400 ||
          msgStr.includes('tồn tại') ||
          msgStr.includes('sử dụng') ||
          msgStr.includes('trùng')
        ) {
          throw patchErr;
        }

        await api.post(`/company/${taxCode}/change-email/confirm`, {
          otp: otpCode.trim(),
          newEmail: cleanEmail,
        });
      }

      toast.success('Thay đổi email liên hệ thành công!');
      setValue('email', cleanEmail);
      setShowChangeEmailModal(false);
      setOtpCode('');
      setNewEmail('');
      setEmailStep(1);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const status = axiosError.response?.status;
      const backendMessage = axiosError.response?.data?.message;
      const msg = Array.isArray(backendMessage) ? backendMessage[0] : (backendMessage || '');

      if (
        status === 409 ||
        msg.includes('tồn tại') ||
        msg.includes('sử dụng') ||
        msg.includes('đã được sử dụng')
      ) {
        toast.error('Email mới đã tồn tại trên hệ thống, vui lòng kiểm tra lại dữ liệu');
      } else if (msg.includes('trùng email') || msg.includes('khác email')) {
        toast.error('Email mới không được trùng email hiện tại , vui lòng kiểm tra lại dữ liệu');
      } else if (msg.includes('Email không hợp lệ') || msg.includes('must be an email')) {
        toast.error('Email không hợp lệ , vui lòng kiểm tra lại dữ liệu');
      } else if (msg.includes('Mã OTP không chính xác') || msg.includes('OTP không chính xác')) {
        toast.error('Mã OTP không chính xác, vui lòng kiểm tra lại');
      } else {
        toast.error(msg || 'Đổi email thất bại, vui lòng thử lại');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleCancelEmailModal = async () => {
    try {
      await api.delete('/users/otp/change-email');
    } catch {
      try {
        await api.delete('/users/otp/reset-password');
      } catch {}
    }
    setShowChangeEmailModal(false);
    setOtpCode('');
    setNewEmail('');
    setEmailStep(1);
  };

  const renderStepper = () => {
    return (
      <div className="py-2 px-6 flex items-center justify-center select-none pb-6 border-b border-gray-100 mb-6">
        <div className="flex items-center">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === 1
                  ? 'bg-[#2F6BFF] text-white shadow-sm'
                  : 'bg-[#2F6BFF] text-white'
              }`}
            >
              {step > 1 ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                '1'
              )}
            </div>
            <span
              className={`text-xs md:text-sm font-semibold transition-colors ${
                step >= 1 ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              Thông tin doanh nghiệp
            </span>
          </div>

          {/* Divider Line */}
          <div
            className={`w-20 md:w-36 h-[1.5px] mx-4 transition-colors ${
              step >= 2 ? 'bg-[#2F6BFF]' : 'bg-gray-200'
            }`}
          />

          {/* Step 2 */}
          <div className="flex items-center gap-2.5">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === 2
                  ? 'bg-[#2F6BFF] text-white shadow-sm'
                  : 'bg-gray-400 text-white'
              }`}
            >
              2
            </div>
            <span
              className={`text-xs md:text-sm font-medium transition-colors ${
                step === 2 ? 'text-[#2F6BFF] font-semibold' : 'text-gray-400'
              }`}
            >
              Xác nhận đăng ký
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F4F6F9] min-h-[70vh]">
        <div className="text-sm font-medium text-gray-500 animate-pulse">
          Đang tải thông tin hồ sơ doanh nghiệp...
        </div>
      </div>
    );
  }

  // STEP 2: XÁC NHẬN ĐĂNG KÝ
  if (step === 2) {
    return (
      <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen p-4 md:p-6 font-sans">
        {/* Top Bar Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 px-6 py-3 flex items-center justify-between mb-4 flex-shrink-0">
          <h1 className="text-base font-bold text-gray-900">Thông tin doanh nghiệp</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 transition-colors cursor-pointer"
            >
              Huỷ bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={isSaving}
              className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:bg-blue-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>{isSaving ? 'Đang lưu...' : 'Xác nhận'}</span>
            </button>
          </div>
        </div>

        {/* Big White Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 md:p-8 space-y-6">
          {renderStepper()}

          {/* Card: Thông tin về hồ sơ */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h2 className="text-base font-bold text-gray-800 mb-5">Thông tin về hồ sơ</h2>

            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Mã số thuế :</span>
                <span className="md:col-span-8 font-bold text-gray-900">{previewData.taxCode}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Tên doanh nghiệp :</span>
                <span className="md:col-span-8 text-gray-900">{previewData.companyName}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Tên viết bằng tiếng nước ngoài :</span>
                <span className="md:col-span-8 text-gray-900">{previewData.foreignCompanyName || '—'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Ngày cấp GPKD:</span>
                <span className="md:col-span-8 text-gray-900">
                  {previewData.licenseIssueDate ? formatDisplayDate(previewData.licenseIssueDate) : '—'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Email :</span>
                <span className="md:col-span-8 text-gray-900">{previewData.email}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Loại hình kinh doanh:</span>
                <span className="md:col-span-8 text-gray-900">{previewData.businessType || '—'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Ngành nghề kinh doanh :</span>
                <span className="md:col-span-8 text-gray-900">{previewData.businessIndustry || '—'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Địa chỉ đăng kí giấy phép kinh doanh :</span>
                <span className="md:col-span-8 text-gray-900">
                  {[previewData.addressDKKD, previewData.wardDKKD, previewData.provinceDKKD].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Địa điểm kinh doanh :</span>
                <span className="md:col-span-8 text-gray-900">
                  {[previewData.addressHDKD, previewData.wardHDKD, previewData.provinceHDKD].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">Người đứng đầu doanh nghiệp :</span>
                <span className="md:col-span-8 text-gray-900">{previewData.representativeName || '—'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                <span className="md:col-span-4 font-semibold text-gray-700">SĐT người đứng đầu :</span>
                <span className="md:col-span-8 text-gray-900">{previewData.representativePhone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section: File đính kèm */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3">File đính kèm</h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="w-72 px-5 py-3 text-xs font-semibold text-gray-700">Tên file</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-700">Thông tin file</th>
                    <th className="w-32 px-5 py-3 text-center text-xs font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {/* Row 1: Giấy phép kinh doanh */}
                  <tr>
                    <td className="px-5 py-3.5 font-medium text-gray-800">Giấy phép kinh doanh</td>
                    <td className="px-5 py-3.5">
                      {previewData.gpkdFile && previewData.gpkdFile !== 'none' ? (
                        <span className="text-gray-800 font-medium truncate max-w-md block" title={previewData.gpkdFile}>
                          {previewData.gpkdFile.split('/').pop()}
                        </span>
                      ) : (
                        <span className="text-gray-400">Chưa có file</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (previewData.gpkdFile && previewData.gpkdFile !== 'none') {
                            setPreviewModalFile({
                              url: getFileUrl(previewData.gpkdFile),
                              name: previewData.gpkdFile.split('/').pop() || previewData.gpkdFile,
                            });
                          }
                        }}
                        disabled={!previewData.gpkdFile || previewData.gpkdFile === 'none'}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center"
                        title="Xem tài liệu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {/* Row 2: Giấy tờ khác */}
                  <tr>
                    <td className="px-5 py-3.5 font-medium text-gray-800">Giấy tờ khác</td>
                    <td className="px-5 py-3.5">
                      {previewData.gtkFile ? (
                        <span className="text-gray-800 font-medium truncate max-w-md block" title={previewData.gtkFile}>
                          {previewData.gtkFile.split('/').pop()}
                        </span>
                      ) : (
                        <span className="text-gray-400">Chưa có file</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (previewData.gtkFile) {
                            setPreviewModalFile({
                              url: getFileUrl(previewData.gtkFile),
                              name: previewData.gtkFile.split('/').pop() || previewData.gtkFile,
                            });
                          }
                        }}
                        disabled={!previewData.gtkFile}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center"
                        title="Xem tài liệu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Step 2 Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 pb-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Trở về
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#2F6BFF] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer disabled:bg-blue-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            {isSaving ? 'Đang cập nhật...' : 'Xác nhận'}
          </button>
        </div>

        <FilePreviewModal
          isOpen={!!previewModalFile}
          onClose={() => setPreviewModalFile(null)}
          fileUrl={previewModalFile?.url || null}
          fileName={previewModalFile?.name}
        />
      </div>
    );
  }

  // STEP 1: NHẬP / CHỈNH SỬA THÔNG TIN
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen p-4 md:p-6 font-sans">
      <input
        type="file"
        ref={fileInputGpkdRef}
        onChange={(e) => handleUploadFile(e, 'gpkd')}
        accept="image/*,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputGtkRef}
        onChange={(e) => handleUploadFile(e, 'gtk')}
        accept="image/*,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
        className="hidden"
      />

      {/* Top Bar Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 px-6 py-3 flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-base font-bold text-gray-900">Thông tin doanh nghiệp</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 transition-colors cursor-pointer"
          >
            Huỷ bỏ
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
            <span>Tiếp tục</span>
          </button>
        </div>
      </div>

      {/* Big White Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 md:p-8 space-y-6">
        {renderStepper()}

        {/* Phần 1: Thêm mới doanh nghiệp */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4">Thêm mới doanh nghiệp</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
            {/* Row 1, Col 1: Tên doanh nghiệp * */}
            <div id="field-business_name" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Tên doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <input
                {...register('business_name')}
                type="text"
                className={`w-full h-[42px] px-3 border rounded-lg text-sm text-gray-800 focus:outline-none transition-colors ${
                  errors.business_name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.business_name && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.business_name.message}</span>
              )}
            </div>

            {/* Row 1, Col 2: Mã số thuế * */}
            <div id="field-tax_code" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Mã số thuế <span className="text-red-500">*</span>
              </label>
              <input
                {...register('tax_code')}
                type="text"
                disabled
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-gray-50 focus:outline-none cursor-not-allowed"
              />
              {errors.tax_code && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.tax_code.message}</span>
              )}
            </div>

            {/* Row 1, Col 3: Loại hình kinh doanh * */}
            <div id="field-business_type" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Loại hình kinh doanh <span className="text-red-500">*</span>
              </label>
              <select
                {...register('business_type')}
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">Chọn loại hình</option>
                {businessTypes.map((bt) => (
                  <option key={bt.id} value={bt.name}>
                    {bt.name}
                  </option>
                ))}
              </select>
              {errors.business_type && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.business_type.message}</span>
              )}
            </div>

            {/* Row 2, Col 1: Ngành nghề kinh doanh chính * */}
            <div id="field-business_industry" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Ngành nghề kinh doanh chính <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                size="md"
                options={businessIndustries.map((bi) => ({ value: bi.name, label: bi.code ? `${bi.code} - ${bi.name}` : bi.name }))}
                value={watchedBusinessIndustry || ''}
                onChange={(val) => setValue('business_industry', val, { shouldValidate: true })}
                placeholder="Chọn ngành nghề"
                error={errors.business_industry?.message}
              />
              {errors.business_industry && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.business_industry.message}</span>
              )}
            </div>

            {/* Row 2, Col 2: Ngày cấp GPKD */}
            <div id="field-license_issue_date" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Ngày cấp GPKD <span className="text-red-500">*</span>
              </label>
              <input
                {...register('license_issue_date')}
                type="date"
                max={new Date().toLocaleDateString('en-CA')}
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              />
              {errors.license_issue_date && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.license_issue_date.message}</span>
              )}
            </div>

            {/* Row 2, Col 3: Tỉnh/Thành phố ĐKKD * */}
            <div id="field-license_registration_province" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Tỉnh/Thành phố ĐKKD <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                size="md"
                options={provinces.map((prov) => ({ value: prov.name, label: prov.name }))}
                value={watchedDkkdProv || ''}
                onChange={(val) => {
                  setValue('license_registration_province', val, { shouldValidate: true });
                  handleDkkdProvinceChange(val);
                }}
                placeholder="Chọn Tỉnh/Thành phố"
                error={errors.license_registration_province?.message}
              />
              {errors.license_registration_province && (
                <span className="text-[11px] text-red-500 mt-1 block">
                  {errors.license_registration_province.message}
                </span>
              )}
            </div>

            {/* Row 3, Col 1: Phường/Xã ĐKKD * */}
            <div id="field-license_registration_ward" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Phường/Xã ĐKKD <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                size="md"
                options={dkkdWards.map((w) => ({ value: w.name, label: w.name }))}
                value={watchedDkkdWard || ''}
                disabled={dkkdWards.length === 0}
                onChange={(val) => {
                  setValue('license_registration_ward', val, { shouldValidate: true });
                }}
                placeholder={dkkdWards.length === 0 ? 'Chọn Tỉnh/TP trước' : 'Chọn Phường/Xã'}
                error={errors.license_registration_ward?.message}
              />
              {errors.license_registration_ward && (
                <span className="text-[11px] text-red-500 mt-1 block">
                  {errors.license_registration_ward.message}
                </span>
              )}
            </div>

            {/* Row 3, Col 2 & 3: Địa chỉ (col-span-2) */}
            <div id="field-license_registration_adress" className="relative md:col-span-2">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Địa chỉ
              </label>
              <input
                {...register('license_registration_adress')}
                type="text"
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Phần 2: Thông tin liên hệ */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4 mt-6">Thông tin liên hệ</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
            {/* Row 1, Col 1: Tên viết bằng tiếng nước ngoài */}
            <div id="field-foreign_business_name" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Tên viết bằng tiếng nước ngoài
              </label>
              <input
                {...register('foreign_business_name')}
                type="text"
                maxLength={255}
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.foreign_business_name && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.foreign_business_name.message}</span>
              )}
            </div>

            {/* Row 1, Col 2: Email * with Thay đổi button */}
            <div id="field-email" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                disabled
                className="w-full h-[42px] pl-3 pr-20 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleRequestChangeEmail}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                Thay đổi
              </button>
              {errors.email && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            {/* Row 1, Col 3: Số điện thoại cơ quan */}
            <div id="field-business_phone" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Số điện thoại cơ quan
              </label>
              <input
                {...register('business_phone')}
                type="text"
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.business_phone && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.business_phone.message}</span>
              )}
            </div>

            {/* Row 2, Col 1: Tỉnh/TP hoạt động KD */}
            <div id="field-business_operating_province" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Tỉnh/TP hoạt động KD
              </label>
              <SearchableSelect
                size="md"
                options={provinces.map((prov) => ({ value: prov.name, label: prov.name }))}
                value={watchedHdkdProv || ''}
                onChange={(val) => {
                  setValue('business_operating_province', val);
                  handleHdkdProvinceChange(val);
                }}
                placeholder="Chọn Tỉnh/TP"
              />
            </div>

            {/* Row 2, Col 2: Phường/xã hoạt động KD */}
            <div id="field-business_operating_ward" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Phường/xã hoạt động KD
              </label>
              <SearchableSelect
                size="md"
                options={hdkdWards.map((w) => ({ value: w.name, label: w.name }))}
                value={watchedHdkdWard || ''}
                disabled={hdkdWards.length === 0}
                onChange={(val) => {
                  setValue('business_operating_ward', val);
                }}
                placeholder={hdkdWards.length === 0 ? 'Chọn Tỉnh/TP trước' : 'Chọn Phường/Xã'}
              />
            </div>

            {/* Row 2, Col 3: Địa điểm kinh doanh */}
            <div id="field-business_operating_adress" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Địa điểm kinh doanh
              </label>
              <input
                {...register('business_operating_adress')}
                type="text"
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Row 3, Col 1 & 2: Người đứng đầu doanh nghiệp (col-span-2) */}
            <div id="field-representative_name" className="relative md:col-span-2">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                Người đứng đầu doanh nghiệp
              </label>
              <input
                {...register('representative_name')}
                type="text"
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.representative_name && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.representative_name.message}</span>
              )}
            </div>

            {/* Row 3, Col 3: SĐT liên hệ người đứng đầu (col-span-1) */}
            <div id="field-representative_phone" className="relative">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                SĐT liên hệ người đứng đầu
              </label>
              <input
                {...register('representative_phone')}
                type="text"
                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.representative_phone && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.representative_phone.message}</span>
              )}
            </div>
          </div>
        </div>

        {/* Phần 3: File đính kèm */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4 mt-6">File đính kèm</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-72 px-5 py-3 text-xs font-semibold text-gray-700">Tên file</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-700">Thông tin file</th>
                  <th className="w-40 px-5 py-3 text-right text-xs font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {/* Row 1: Giấy phép kinh doanh */}
                <tr>
                  <td className="px-5 py-3.5 font-medium text-gray-800">Giấy phép kinh doanh</td>
                  <td className="px-5 py-3.5">
                    {gpkdUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#2F6BFF] h-full transition-all" style={{ width: `${gpkdProgress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{gpkdProgress}%</span>
                      </div>
                    ) : gpkdFileVal && gpkdFileVal !== 'none' ? (
                      <span className="text-gray-800 font-medium truncate max-w-md block" title={gpkdFileVal}>
                        {gpkdFileVal.split('/').pop()}
                      </span>
                    ) : (
                      <span className="text-gray-400">Chưa có file</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => {
                          if (gpkdFileVal && gpkdFileVal !== 'none') {
                            setPreviewModalFile({
                              url: getFileUrl(gpkdFileVal),
                              name: gpkdFileVal.split('/').pop() || gpkdFileVal,
                            });
                          }
                        }}
                        disabled={!gpkdFileVal || gpkdFileVal === 'none'}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Xem tài liệu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Upload */}
                      <button
                        type="button"
                        onClick={() => fileInputGpkdRef.current?.click()}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Tải lên tài liệu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setValue('business_license_file_url', '')}
                        disabled={!gpkdFileVal || gpkdFileVal === 'none'}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Xóa tài liệu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 2: Giấy tờ khác */}
                <tr>
                  <td className="px-5 py-3.5 font-medium text-gray-800">Giấy tờ khác</td>
                  <td className="px-5 py-3.5">
                    {gtkUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#2F6BFF] h-full transition-all" style={{ width: `${gtkProgress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{gtkProgress}%</span>
                      </div>
                    ) : gtkFileVal ? (
                      <span className="text-gray-800 font-medium truncate max-w-md block" title={gtkFileVal}>
                        {gtkFileVal.split('/').pop()}
                      </span>
                    ) : (
                      <span className="text-gray-400">Chưa có file</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => {
                          if (gtkFileVal) {
                            setPreviewModalFile({
                              url: getFileUrl(gtkFileVal),
                              name: gtkFileVal.split('/').pop() || gtkFileVal,
                            });
                          }
                        }}
                        disabled={!gtkFileVal}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Xem tài liệu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Upload */}
                      <button
                        type="button"
                        onClick={() => fileInputGtkRef.current?.click()}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Tải lên tài liệu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setValue('other_document_file_url', '')}
                        disabled={!gtkFileVal}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Xóa tài liệu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {errors.business_license_file_url && (
            <span className="text-[11px] text-red-500 mt-1 block">
              {errors.business_license_file_url.message}
            </span>
          )}
        </div>
      </div>
    </form>

    <FilePreviewModal
      isOpen={!!previewModalFile}
      onClose={() => setPreviewModalFile(null)}
      fileUrl={previewModalFile?.url || null}
      fileName={previewModalFile?.name}
    />

    {/* Change Email Modal */}
    {showChangeEmailModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-[420px] w-full p-8 transition-all">
          <h2 className="text-[#2F6BFF] text-xl font-bold tracking-tight uppercase text-center mb-4">
            THAY ĐỔI EMAIL
          </h2>

          {emailStep === 1 ? (
            <div
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleOtpConfirm(e);
                }
              }}
            >
              <div className="text-center text-sm text-gray-600 mb-6 space-y-0.5">
                <p>Chúng tôi đã gửi mã xác minh qua số email cũ</p>
                <p className="font-bold text-gray-900">{currentEmail || '...'}</p>
                <p>Bạn vui lòng kiểm tra và điền mã xác thực</p>
              </div>

              <div className="relative mb-3">
                <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-xs font-semibold text-gray-500 z-10">
                  OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder=""
                  autoFocus
                  className="w-full h-11 px-3.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#2F6BFF] transition-colors"
                />
              </div>

              <div className="text-center mb-6">
                <div className="text-[#2F6BFF] font-medium text-sm mb-1">
                  00:{emailTimer < 10 ? `0${emailTimer}` : emailTimer}
                </div>
                <div className="text-sm text-gray-500">
                  Chưa nhận được mã?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isEmailLoading || emailTimer > 0}
                    className={`font-semibold transition-colors ${
                      emailTimer > 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#2F6BFF] hover:underline cursor-pointer'
                    }`}
                  >
                    Gửi lại
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOtpConfirm}
                disabled={isEmailLoading || otpCode.length !== 6}
                className="w-full bg-[#2F6BFF] hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl shadow-md transition-all text-sm mb-3.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isEmailLoading ? 'Đang kiểm tra...' : 'Xác nhận'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleCancelEmailModal}
                  className="text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          ) : (
            <div
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEmailConfirmSave(e);
                }
              }}
            >
              <div className="text-center text-sm text-gray-600 mb-6">
                <p>Vui lòng nhập email mới</p>
              </div>

              <div className="relative mb-6">
                <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-xs font-semibold text-gray-500 z-10">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder=""
                  autoFocus
                  className="w-full h-11 px-3.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#2F6BFF] transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleEmailConfirmSave}
                disabled={isEmailLoading || !newEmail.trim()}
                className="w-full bg-[#2F6BFF] hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl shadow-md transition-all text-sm mb-3.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isEmailLoading ? 'Đang lưu...' : 'Lưu'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleCancelEmailModal}
                  className="text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </>
);
};
