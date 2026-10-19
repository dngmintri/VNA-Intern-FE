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
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}-${month}-${year}`;
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

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [provRes, btRes, biRes] = await Promise.all([
          api.get<Province[]>('/location/provinces'),
          api.get<{ data?: BusinessType[] } & BusinessType[]>('/business-types/all'),
          api.get<{ data?: BusinessIndustry[] } & BusinessIndustry[]>('/business-industries/roots'),
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
        if (taxCode.length > 20 && taxCode.includes('-')) {
          const res = await api.get<{ data?: any } & any>(`/business/${taxCode}`);
          p = res.data?.data || res.data;
        } else {
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
          business_license_file_url: 'none',
          other_document_file_url: '',
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

  const onSubmit = async (data: CompanyInput) => {
    setIsSubmitting(true);

    const payload = {
      business_name: data.business_name.trim(),
      tax_code: data.tax_code.trim(),
      business_type: data.business_type,
      business_industry: data.business_industry,
      license_issue_date: data.license_issue_date ? formatToBEDate(data.license_issue_date) : null,
      license_registration_province: data.license_registration_province,
      license_registration_ward: data.license_registration_ward,
      license_registration_adress: data.license_registration_adress || null,
      foreign_business_name: data.foreign_business_name || null,
      email: data.email.trim(),
      business_phone: data.business_phone || null,
      business_operating_province: data.business_operating_province || null,
      business_operating_ward: data.business_operating_ward || null,
      business_operating_adress: data.business_operating_adress || null,
      representative_name: data.representative_name || null,
      representative_phone: data.representative_phone || null,
      business_license_file_url: data.business_license_file_url || null,
      other_document_file_url: data.other_document_file_url || null,
    };

    if (isEditMode) {
      const targetId = companyId || taxCode;
      const matchedBt = businessTypes.find(bt => String(bt.id) === data.business_type || bt.code === data.business_type || bt.name === data.business_type);
      const matchedBi = businessIndustries.find(bi => String(bi.id) === data.business_industry || bi.code === data.business_industry || bi.name === data.business_industry);

      const updatePayload = {
        name: data.business_name.trim(),
        taxCode: data.tax_code.trim(),
        businessTypeId: matchedBt ? String(matchedBt.id) : (businessTypes[0]?.id ? String(businessTypes[0].id) : undefined),
        businessIndustryId: matchedBi ? String(matchedBi.id) : (businessIndustries[0]?.id ? String(businessIndustries[0].id) : undefined),
        licenseDate: data.license_issue_date ? (data.license_issue_date.includes('-') && data.license_issue_date.split('-')[0].length === 4 ? data.license_issue_date : formatToBEDate(data.license_issue_date)) : null,
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

    setPreviewData({
      business_name: data.business_name,
      tax_code: data.tax_code,
      email: data.email,
      business_type: data.business_type,
      business_industry: data.business_industry,
      license_registration_province: data.license_registration_province,
      license_registration_ward: data.license_registration_ward,
      representative_name: data.representative_name || '—',
      business_phone: data.business_phone || '—',
    });
    setStep(2);
    setIsSubmitting(false);
  };

  const handleConfirmCreate = async () => {
    setIsSubmitting(true);
    const data = getValues();
    
    const matchedBt = businessTypes.find(bt => String(bt.id) === data.business_type || bt.code === data.business_type || bt.name === data.business_type);
    const matchedBi = businessIndustries.find(bi => String(bi.id) === data.business_industry || bi.code === data.business_industry || bi.name === data.business_industry);

    const payload = {
      name: data.business_name.trim(),
      taxCode: data.tax_code.trim(),
      businessTypeId: matchedBt ? String(matchedBt.id) : (businessTypes[0]?.id ? String(businessTypes[0].id) : data.business_type),
      businessIndustryId: matchedBi ? String(matchedBi.id) : (businessIndustries[0]?.id ? String(businessIndustries[0].id) : data.business_industry),
      licenseDate: data.license_issue_date ? (data.license_issue_date.includes('-') && data.license_issue_date.split('-')[0].length === 4 ? data.license_issue_date : formatToBEDate(data.license_issue_date)) : null,
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
      isActive: true,
    };

    try {
      await api.post('/business', payload);
      toast.success('Tạo doanh nghiệp thành công!');
      if (onSuccess) {
        onSuccess({ username: data.tax_code.trim() });
      } else {
        router.push('/dashboard/companies');
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const msg = axiosError.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Tạo doanh nghiệp thất bại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepper = () => {
    if (isEditMode) return null;

    return (
      <div className="bg-white border-b border-gray-100 pt-4 pb-8 px-6 flex items-center justify-center flex-shrink-0 select-none">
        <div className="flex items-center w-full max-w-xs">
          <div className="flex flex-col items-center relative text-blue-600">
            <div className={`rounded-full transition-colors duration-300 h-7 w-7 flex items-center justify-center border-2 font-bold text-xs ${
              step >= 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-300'
            }`}>
              1
            </div>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center text-[10.5px] font-bold text-blue-600 whitespace-nowrap">
              Nhập thông tin
            </div>
          </div>
          
          <div className="flex-auto border-t-2 transition-colors duration-300 mx-2" style={{ borderColor: step >= 2 ? '#2F6BFF' : '#E2E8F0' }} />
          
          <div className="flex flex-col items-center relative">
            <div className={`rounded-full transition-colors duration-300 h-7 w-7 flex items-center justify-center border-2 font-bold text-xs ${
              step >= 2 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-450 border-gray-300'
            }`}>
              2
            </div>
            <div className={`absolute top-8 left-1/2 -translate-x-1/2 text-center text-[10.5px] font-bold whitespace-nowrap ${
              step >= 2 ? 'text-blue-600' : 'text-gray-400'
            }`}>
              Kiểm tra thông tin
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingMeta) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F4F6F9] min-h-[70vh]">
        <div className="text-sm font-medium text-gray-500 animate-pulse">
          Đang tải biểu mẫu doanh nghiệp...
        </div>
      </div>
    );
  }



  if (step === 2) {
    return (
      <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-[70vh] font-sans">
        <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
          <h1 className="text-sm font-bold text-gray-800">Xác nhận thông tin doanh nghiệp</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Trở lại
            </button>
            <button
              onClick={handleConfirmCreate}
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:bg-blue-400"
            >
              {isSubmitting ? 'Đang khởi tạo...' : 'Xác nhận tạo'}
            </button>
          </div>
        </div>
        {renderStepper()}

        <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 tracking-wide">
                1. Thông tin pháp lý & ĐKKD
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs mt-4">
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Tên doanh nghiệp:</span>
                  <span className="font-semibold text-gray-800">{previewData.companyName}</span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Mã số thuế:</span>
                  <span className="font-semibold text-gray-800">{previewData.taxCode}</span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Tên tiếng nước ngoài:</span>
                  <span className="font-semibold text-gray-800">{previewData.foreignCompanyName || '—'}</span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Loại hình doanh nghiệp:</span>
                  <span className="font-semibold text-gray-800">{previewData.businessType}</span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Ngành nghề kinh doanh:</span>
                  <span className="font-semibold text-gray-800">{previewData.businessIndustry}</span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Ngày cấp GPKD:</span>
                  <span className="font-semibold text-gray-800">
                    {previewData.licenseIssueDate ? formatDisplayDate(previewData.licenseIssueDate) : '—'}
                  </span>
                </div>
                <div className="flex flex-col py-1 md:col-span-2">
                  <span className="text-gray-400 font-medium mb-1">Địa chỉ đăng ký kinh doanh:</span>
                  <span className="font-semibold text-gray-800">
                    {`${previewData.addressDKKD || ''}, ${previewData.wardDKKD || ''}, ${previewData.provinceDKKD || ''}`}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 tracking-wide mt-2">
                2. Thông tin liên hệ & HĐKD
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs mt-4">
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Email doanh nghiệp:</span>
                  <span className="font-semibold text-gray-800">{previewData.email}</span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Điện thoại doanh nghiệp:</span>
                  <span className="font-semibold text-gray-800">{previewData.businessPhone || '—'}</span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Người đại diện pháp luật:</span>
                  <span className="font-semibold text-gray-800">{previewData.representativeName || '—'}</span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Điện thoại người đại diện:</span>
                  <span className="font-semibold text-gray-800">{previewData.representativePhone || '—'}</span>
                </div>
                <div className="flex flex-col py-1 md:col-span-2">
                  <span className="text-gray-400 font-medium mb-1">Địa chỉ hoạt động kinh doanh:</span>
                  <span className="font-semibold text-gray-800">
                    {previewData.provinceHDKD
                      ? `${previewData.addressHDKD || ''}, ${previewData.wardHDKD || ''}, ${previewData.provinceHDKD || ''}`
                      : '—'}
                  </span>
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Giấy phép kinh doanh (file):</span>
                  {previewData.gpkdFile ? (
                    <a
                      href={previewData.gpkdFile.startsWith('http') ? previewData.gpkdFile : `http://localhost:8080/uploads/${previewData.gpkdFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline truncate max-w-xs"
                    >
                      {previewData.gpkdFile}
                    </a>
                  ) : (
                    <span className="font-semibold text-gray-500">—</span>
                  )}
                </div>
                <div className="flex flex-col py-1">
                  <span className="text-gray-400 font-medium mb-1">Tài liệu khác đính kèm:</span>
                  {previewData.gtkFile ? (
                    <a
                      href={previewData.gtkFile.startsWith('http') ? previewData.gtkFile : `http://localhost:8080/uploads/${previewData.gtkFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline truncate max-w-xs"
                    >
                      {previewData.gtkFile}
                    </a>
                  ) : (
                    <span className="font-semibold text-gray-500">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1 flex flex-col bg-[#F4F6F9] min-h-[70vh] font-sans">
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <h1 className="text-sm font-bold text-gray-800">
          {isEditMode ? `Cập nhật doanh nghiệp: ${taxCode}` : 'Thêm mới doanh nghiệp'}
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleClose()}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:bg-blue-400"
          >
            {isSubmitting ? 'Đang tải...' : isEditMode ? 'Lưu cập nhật' : 'Tiếp tục'}
          </button>
        </div>
      </div>
      {renderStepper()}

      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 tracking-wide">
            1. Thông tin pháp lý & đăng ký kinh doanh
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
            <div id="field-business_name" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Tên doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <input
                {...register('business_name')}
                type="text"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
              />
              {errors.business_name && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.business_name.message}</span>
              )}
            </div>

            <div id="field-tax_code" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Mã số thuế <span className="text-red-500">*</span>
              </label>
              <input
                {...register('tax_code')}
                type="text"
                disabled={isEditMode}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
              {errors.tax_code && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.tax_code.message}</span>
              )}
            </div>

            <div id="field-foreign_business_name" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Tên tiếng nước ngoài
              </label>
              <input
                {...register('foreign_business_name')}
                type="text"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
              />
            </div>

            <div id="field-business_type" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Loại hình doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <select
                {...register('business_type')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:border-blue-500 text-gray-700"
              >
                <option value="">Chọn loại hình</option>
                {businessTypes.map((bt) => (
                  <option key={bt.id} value={bt.name}>
                    {bt.name}
                  </option>
                ))}
              </select>
              {errors.business_type && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.business_type.message}</span>
              )}
            </div>

            <div id="field-business_industry" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10 text-gray-600">
                Ngành nghề kinh doanh chính <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={businessIndustries.map((bi) => ({ value: bi.name, label: bi.code ? `${bi.code} - ${bi.name}` : bi.name }))}
                value={watchedBusinessIndustry || ''}
                onChange={(val) => setValue('business_industry', val, { shouldValidate: true })}
                placeholder=""
                error={errors.business_industry?.message}
              />
              {errors.business_industry && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.business_industry.message}</span>
              )}
            </div>

            <div id="field-license_issue_date" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Ngày cấp GPKD
              </label>
              <input
                {...register('license_issue_date')}
                type="date"
                max={new Date().toLocaleDateString('en-CA')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900 font-medium"
              />

              {errors.license_issue_date && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.license_issue_date.message}</span>
              )}
            </div>

            <div id="field-license_registration_province" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10 text-gray-600">
                Tỉnh/Thành phố ĐKKD <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={provinces.map((prov) => ({ value: prov.name, label: prov.name }))}
                value={watchedDkkdProv || ''}
                onChange={(val) => {
                  setValue('license_registration_province', val, { shouldValidate: true });
                  handleDkkdProvinceChange(val);
                }}
                placeholder=""
                error={errors.license_registration_province?.message}
              />
              {errors.license_registration_province && (
                <span className="text-[10px] text-red-500 mt-1 block">
                  {errors.license_registration_province.message}
                </span>
              )}
            </div>

            <div id="field-license_registration_ward" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10 text-gray-600">
                Phường/Xã ĐKKD <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={dkkdWards.map((w) => ({ value: w.name, label: w.name }))}
                value={watchedDkkdWard || ''}
                disabled={dkkdWards.length === 0}
                onChange={(val) => {
                  setValue('license_registration_ward', val, { shouldValidate: true });
                }}
                placeholder=""
                error={errors.license_registration_ward?.message}
              />
              {errors.license_registration_ward && (
                <span className="text-[10px] text-red-500 mt-1 block">
                  {errors.license_registration_ward.message}
                </span>
              )}
            </div>

            <div id="field-license_registration_adress" className="relative mt-2 md:col-span-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Địa chỉ chi tiết ĐKKD
              </label>
              <input
                {...register('license_registration_adress')}
                type="text"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 tracking-wide">
            2. Thông tin liên hệ & địa chỉ hoạt động kinh doanh
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
            <div id="field-email" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Email doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
              />
              {errors.email && <span className="text-[10px] text-red-500 mt-1 block">{errors.email.message}</span>}
            </div>

            <div id="field-business_phone" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Điện thoại doanh nghiệp
              </label>
              <input
                {...register('business_phone')}
                type="text"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
              />
              {errors.business_phone && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.business_phone.message}</span>
              )}
            </div>

            <div id="field-representative_name" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Người đại diện pháp luật
              </label>
              <input
                {...register('representative_name')}
                type="text"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
              />
              {errors.representative_name && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.representative_name.message}</span>
              )}
            </div>

            <div id="field-representative_phone" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Điện thoại người đại diện
              </label>
              <input
                {...register('representative_phone')}
                type="text"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
              />
              {errors.representative_phone && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.representative_phone.message}</span>
              )}
            </div>

            <div id="field-business_operating_province" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10 text-gray-600">
                Tỉnh/Thành phố HĐKD
              </label>
              <SearchableSelect
                options={provinces.map((prov) => ({ value: prov.name, label: prov.name }))}
                value={watchedHdkdProv || ''}
                onChange={(val) => {
                  setValue('business_operating_province', val);
                  handleHdkdProvinceChange(val);
                }}
                placeholder=""
              />
            </div>

            <div id="field-business_operating_ward" className="relative mt-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10 text-gray-600">
                Phường/Xã HĐKD
              </label>
              <SearchableSelect
                options={hdkdWards.map((w) => ({ value: w.name, label: w.name }))}
                value={watchedHdkdWard || ''}
                disabled={hdkdWards.length === 0}
                onChange={(val) => {
                  setValue('business_operating_ward', val);
                }}
                placeholder=""
              />
            </div>

            <div id="field-business_operating_adress" className="relative mt-2 md:col-span-2">
              <label className="absolute -top-2 left-2 bg-white px-1 text-gray-600 font-semibold scale-90 origin-left z-10">
                Địa chỉ chi tiết HĐKD
              </label>
              <input
                {...register('business_operating_adress')}
                type="text"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-gray-700"
              />
            </div>

            <div id="field-business_license_file_url" className="mt-2 md:col-span-1">
              <span className="text-gray-600 font-semibold block mb-1">
                Giấy phép đăng ký kinh doanh (GPKD) <span className="text-red-500">*</span>
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                  Tải lên tài liệu
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'gpkd')}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                </label>
                {gpkdUploading && (
                  <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-200" style={{ width: `${gpkdProgress}%` }} />
                  </div>
                )}
                {gpkdFileVal && !gpkdUploading && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                    <a
                      href={gpkdFileVal.startsWith('http') ? gpkdFileVal : `http://localhost:8080/uploads/${gpkdFileVal}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold truncate max-w-[150px]"
                      title="Xem file đã tải lên"
                    >
                      {gpkdFileVal}
                    </a>
                    <button
                      type="button"
                      onClick={() => setValue('business_license_file_url', '')}
                      className="text-red-500 hover:text-red-700 font-bold px-1 hover:bg-gray-200/60 rounded transition-colors cursor-pointer"
                      title="Gỡ bỏ tài liệu"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              {errors.business_license_file_url && (
                <span className="text-[10px] text-red-500 mt-1 block">
                  {errors.business_license_file_url.message}
                </span>
              )}
            </div>

            <div id="field-other_document_file_url" className="mt-2 md:col-span-1">
              <span className="text-gray-600 font-semibold block mb-1">Tài liệu khác đính kèm</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                  Tải lên tài liệu
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'gtk')}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                </label>
                {gtkUploading && (
                  <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-200" style={{ width: `${gtkProgress}%` }} />
                  </div>
                )}
                {gtkFileVal && !gtkUploading && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                    <a
                      href={gtkFileVal.startsWith('http') ? gtkFileVal : `http://localhost:8080/uploads/${gtkFileVal}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold truncate max-w-[150px]"
                      title="Xem file đã tải lên"
                    >
                      {gtkFileVal}
                    </a>
                    <button
                      type="button"
                      onClick={() => setValue('other_document_file_url', '')}
                      className="text-red-500 hover:text-red-700 font-bold px-1 hover:bg-gray-200/60 rounded transition-colors cursor-pointer"
                      title="Gỡ bỏ tài liệu"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
