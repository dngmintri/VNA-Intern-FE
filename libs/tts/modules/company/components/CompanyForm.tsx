'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { api } from '@/libs/core/api/axios';
import { companySchema, CompanyInput } from '../schemas/company.schema';
import { BusinessType, BusinessIndustry } from '../interfaces/company.interface';
import { SearchableSelect } from './SearchableSelect';

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

interface Province {
  id: number;
  name: string;
}

interface Ward {
  id: number;
  name: string;
  provinceId: number;
}

interface CompanyFormProps {
  taxCode?: string;
  onClose?: () => void;
  onSuccess?: (account: { username: string; password?: string }) => void;
}

export const CompanyForm = ({ taxCode, onClose, onSuccess }: CompanyFormProps) => {
  const router = useRouter();
  const isEditMode = !!taxCode;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push('/dashboard/companies');
    }
  };

  const [step, setStep] = useState<number>(1);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [businessIndustries, setBusinessIndustries] = useState<BusinessIndustry[]>([]);

  const [dkkdWards, setDkkdWards] = useState<Ward[]>([]);
  const [hdkdWards, setHdkdWards] = useState<Ward[]>([]);

  const [selectedDkkdProvId, setSelectedDkkdProvId] = useState<string>('');
  const [selectedHdkdProvId, setSelectedHdkdProvId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [gpkdUploading, setGpkdUploading] = useState<boolean>(false);
  const [gpkdProgress, setGpkdProgress] = useState<number>(0);
  const [gtkUploading, setGtkUploading] = useState<boolean>(false);
  const [gtkProgress, setGtkProgress] = useState<number>(0);

  const [previewData, setPreviewData] = useState<Record<string, string | null>>({});
  const [showCreatedAccountModal, setShowCreatedAccountModal] = useState<boolean>(false);
  const [createdAccountInfo, setCreatedAccountInfo] = useState<{ username: string; password: string }>({
    username: '',
    password: '12345678',
  });

  const gpkdInputRef = useRef<HTMLInputElement>(null);
  const gtkInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
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

  const getFileUrl = (filePath: string | null | undefined): string => {
    if (!filePath || filePath === 'none') return '';
    if (filePath.startsWith('http')) return filePath;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}${filePath.startsWith('/') ? '' : '/uploads/documents/'}${filePath}`;
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [provRes, btRes, biRes] = await Promise.all([
          api.get<Province[]>('/location/provinces'),
          api.get<{ data?: BusinessType[] } & BusinessType[]>('/business-types/all'),
          api.get<{ data?: BusinessIndustry[] } & BusinessIndustry[]>('/business-industries/level/4?isActive=true'),
        ]);

        setProvinces(provRes.data || []);
        setBusinessTypes(btRes.data?.data || btRes.data || []);
        setBusinessIndustries(biRes.data?.data || biRes.data || []);
      } catch (err) {
        console.error('Lỗi tải dữ liệu danh mục:', err);
        toast.error('Không thể tải các danh mục hỗ trợ');
      } finally {
        setIsLoadingMeta(false);
      }
    };

    fetchMetadata();
  }, []);

  useEffect(() => {
    if (isLoadingMeta || !isEditMode || !taxCode) return;

    const fetchCompanyProfile = async () => {
      try {
        let p: any = null;
        try {
          const res = await api.get<{ data?: any } & any>(`/business/${taxCode}`);
          p = res.data?.data || res.data;
        } catch {
          const res = await api.get<{ data?: { items: any[] } } & any>(`/business?search=${taxCode}`);
          const items = res.data?.data?.items || res.data?.items || [];
          p = items.find((item: any) => item.taxCode === taxCode) || items[0];
        }

        if (!p) return;
        setCompanyId(p.id);

        const matchedDkkdProv = provinces.find((prov) => prov.name === (p.registeredProvince || p.provinceDKKD));
        if (matchedDkkdProv) {
          setSelectedDkkdProvId(String(matchedDkkdProv.id));
          const wardsRes = await api.get<Ward[]>(`/location/provinces/${matchedDkkdProv.id}/wards`);
          setDkkdWards(wardsRes.data || []);
        }

        const matchedHdkdProv = provinces.find((prov) => prov.name === (p.operatingProvince || p.provinceHDKD));
        if (matchedHdkdProv) {
          setSelectedHdkdProvId(String(matchedHdkdProv.id));
          const wardsRes = await api.get<Ward[]>(`/location/provinces/${matchedHdkdProv.id}/wards`);
          setHdkdWards(wardsRes.data || []);
        }

        reset({
          business_name: p.name || p.companyName || '',
          foreign_business_name: p.foreignName || p.foreignCompanyName || '',
          tax_code: p.taxCode || '',
          business_type: p.businessType?.name || p.businessTypeId || p.businessType || '',
          business_industry: p.businessIndustry?.name || p.businessIndustryId || p.businessIndustry || '',
          license_issue_date: (p.licenseDate || p.licenseIssueDate) ? formatToInputDate(p.licenseDate || p.licenseIssueDate) : '',
          license_registration_province: p.registeredProvince || p.provinceDKKD || '',
          license_registration_ward: p.registeredDistrict || p.wardDKKD || '',
          license_registration_adress: p.address || p.addressDKKD || '',
          email: p.email || '',
          business_phone: p.officePhone || p.businessPhone || '',
          business_operating_province: p.operatingProvince || p.provinceHDKD || '',
          business_operating_ward: p.operatingDistrict || p.wardHDKD || '',
          business_operating_adress: p.businessLocation || p.addressHDKD || '',
          representative_name: p.representativeName || '',
          representative_phone: p.representativePhone || '',
          business_license_file_url: p.gpkdFilePath || 'none',
          other_document_file_url: p.otherDocumentPath || '',
        });
      } catch (err: unknown) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const msg = axiosError.response?.data?.message || 'Không thể tải thông tin doanh nghiệp';
        toast.error(msg);
      }
    };

    fetchCompanyProfile();
  }, [isLoadingMeta, isEditMode, taxCode, provinces, reset]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'gpkd' | 'gtk') => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // When submitting Step 1: validate and transition to Step 2 for both Create & Edit
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

  // Step 2 Confirm Action: executes PATCH (if edit) or POST (if create)
  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    const data = getValues();
    
    const matchedBt = businessTypes.find(bt => String(bt.id) === data.business_type || bt.code === data.business_type || bt.name === data.business_type);
    const matchedBi = businessIndustries.find(bi => String(bi.id) === data.business_industry || bi.code === data.business_industry || bi.name === data.business_industry);

    if (isEditMode) {
      const targetId = companyId || taxCode;
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

      try {
        await api.patch(`/business/${targetId}`, updatePayload);
        toast.success('Cập nhật thông tin doanh nghiệp thành công!');
        handleClose();
      } catch (err: unknown) {
        const axiosError = err as AxiosError<{ message?: string | string[] }>;
        const msg = axiosError.response?.data?.message;
        toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Cập nhật thất bại. Vui lòng kiểm tra lại!'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Create mode POST
    const payload = {
      name: data.business_name.trim(),
      taxCode: data.tax_code.trim(),
      businessTypeId: matchedBt ? String(matchedBt.id) : (businessTypes[0]?.id ? String(businessTypes[0].id) : data.business_type),
      businessIndustryId: matchedBi ? String(matchedBi.id) : (businessIndustries[0]?.id ? String(businessIndustries[0].id) : data.business_industry),
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
      isActive: true,
    };

    try {
      await api.post('/business', payload);
      toast.success('Tạo doanh nghiệp thành công!');
      setCreatedAccountInfo({
        username: data.tax_code.trim(),
        password: '12345678',
      });
      setShowCreatedAccountModal(true);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const msg = axiosError.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Tạo doanh nghiệp thất bại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepper = () => {
    return (
      <div className="py-2 px-6 flex items-center justify-center select-none border-b border-gray-100 pb-6 mb-6">
        <div className="flex items-center">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === 1
                  ? 'bg-[#2F6BFF] text-white shadow-sm'
                  : 'bg-[#2F6BFF] text-white'
              }`}
            >
              {step > 1 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                '1'
              )}
            </div>
            <span
              className={`text-sm font-semibold transition-colors ${
                step >= 1 ? 'text-[#2F6BFF]' : 'text-gray-400'
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
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === 2
                  ? 'bg-[#2F6BFF] text-white shadow-sm'
                  : 'bg-white border border-gray-300 text-gray-400'
              }`}
            >
              2
            </div>
            <span
              className={`text-sm font-semibold transition-colors ${
                step === 2 ? 'text-[#2F6BFF]' : 'text-gray-400'
              }`}
            >
              Xác nhận đăng ký
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingMeta) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#EAEDF2] min-h-[70vh]">
        <div className="text-sm font-medium text-gray-500 animate-pulse">
          Đang tải biểu mẫu doanh nghiệp...
        </div>
      </div>
    );
  }

  // Hidden File Inputs
  const renderHiddenFileInputs = () => (
    <>
      <input
        type="file"
        ref={gpkdInputRef}
        onChange={(e) => handleFileUpload(e, 'gpkd')}
        accept="image/*,application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={gtkInputRef}
        onChange={(e) => handleFileUpload(e, 'gtk')}
        accept="image/*,application/pdf"
        className="hidden"
      />
    </>
  );

  const handleCloseCreatedAccountModal = () => {
    setShowCreatedAccountModal(false);
    if (onSuccess) {
      onSuccess({ username: createdAccountInfo.username, password: createdAccountInfo.password });
    }
    handleClose();
  };

  const renderCreatedAccountModal = () => {
    if (!showCreatedAccountModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in duration-150">
          {/* Header */}
          <div className="bg-[#2F6BFF] py-3.5 px-6 text-center">
            <h3 className="text-white font-bold text-lg">Thông tin tài khoản</h3>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <div className="space-y-4 text-[15px] text-gray-900">
              <div className="flex items-center gap-1.5">
                <span>• Tài khoản:</span>
                <span className="font-bold">{createdAccountInfo.username}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>• Mật khẩu:</span>
                <span className="font-bold">{createdAccountInfo.password}</span>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={handleCloseCreatedAccountModal}
                className="text-[#2F6BFF] hover:text-blue-700 font-semibold text-sm cursor-pointer transition-colors"
              >
                Huỷ bỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // STEP 2: XÁC NHẬN ĐĂNG KÝ
  if (step === 2) {
    return (
      <div className="flex-1 flex flex-col bg-[#EAEDF2] min-h-[85vh] p-6 font-sans">
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-4">
            <h1 className="text-lg font-bold text-gray-800">
              {isEditMode ? 'Edit DN' : 'Thêm mới DN'}
            </h1>
          </div>

          {/* Big White Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 md:p-8 space-y-6">
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
                  <span className="md:col-span-4 font-semibold text-gray-700">Email</span>
                  <span className="md:col-span-8 text-gray-900">{previewData.email}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                  <span className="md:col-span-4 font-semibold text-gray-700">Loại hình kinh doanh:</span>
                  <span className="md:col-span-8 text-gray-900">{previewData.businessType || '—'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                  <span className="md:col-span-4 font-semibold text-gray-700">Ngành nghề kinh doanh</span>
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
                  <span className="md:col-span-4 font-semibold text-gray-700">Người đứng đầu doanh nghiệp</span>
                  <span className="md:col-span-8 text-gray-900">{previewData.representativeName || '—'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 items-baseline py-1">
                  <span className="md:col-span-4 font-semibold text-gray-700">SĐT người đứng đầu</span>
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
                              window.open(getFileUrl(previewData.gpkdFile), '_blank');
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
                              window.open(getFileUrl(previewData.gtkFile), '_blank');
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
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#2F6BFF] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer disabled:bg-blue-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              {isSubmitting ? (isEditMode ? 'Đang cập nhật...' : 'Đang tạo...') : 'Xác nhận'}
            </button>
          </div>
        </div>

        {renderCreatedAccountModal()}
      </div>
    );
  }

  // STEP 1: NHẬP / CHỈNH SỬA THÔNG TIN
  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1 flex flex-col bg-[#EAEDF2] min-h-[85vh] p-6 font-sans">
      {renderHiddenFileInputs()}

      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-800">
            {isEditMode ? 'Edit DN' : 'Thêm mới DN'}
          </h1>
        </div>

        {/* Big White Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 md:p-8 space-y-6">
          {renderStepper()}

          {/* Phần 1: Cập nhật doanh nghiệp / Thêm mới doanh nghiệp */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h2 className="text-base font-bold text-gray-800 mb-5">
              {isEditMode ? 'Cập nhật doanh nghiệp' : 'Thêm mới doanh nghiệp'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              {/* Row 1, Col 1: Tên doanh nghiệp * */}
              <div id="field-business_name" className="relative">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Tên doanh nghiệp <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('business_name')}
                  type="text"
                  className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
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
                  disabled={isEditMode}
                  className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                  Ngày cấp GPKD
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
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h2 className="text-base font-bold text-gray-800 mb-5">Thông tin liên hệ</h2>

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

              {/* Row 1, Col 2: Email * */}
              <div id="field-email" className="relative">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                />
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

              {/* Row 2, Col 3: Empty placeholder for 3-col grid */}
              <div className="hidden md:block"></div>

              {/* Row 3, Col 1: Địa điểm kinh doanh */}
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

              {/* Row 3, Col 2: Người đứng đầu doanh nghiệp */}
              <div id="field-representative_name" className="relative">
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

              {/* Row 3, Col 3: SĐT liên hệ người đứng đầu */}
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
            <h2 className="text-base font-bold text-gray-800 mb-3">File đính kèm</h2>
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
                              window.open(getFileUrl(gpkdFileVal), '_blank');
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
                          onClick={() => gpkdInputRef.current?.click()}
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
                              window.open(getFileUrl(gtkFileVal), '_blank');
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
                          onClick={() => gtkInputRef.current?.click()}
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

        {/* Step 1 Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 pb-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#2F6BFF] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer disabled:bg-blue-300"
          >
            Tiếp tục
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {renderCreatedAccountModal()}
    </form>
  );
};
