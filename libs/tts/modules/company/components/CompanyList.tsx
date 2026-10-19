'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
  if (parts.length === 3) {
    const [first, second, third] = parts;
    if (first.length === 4) {
      return `${third}/${second}/${first}`;
    } else {
      return `${first}/${second}/${third}`;
    }
  }
  return normalized;
};
import { api } from '@/libs/core/api/axios';
import { AxiosError } from 'axios';
import { Company, CompanyProfile } from '../interfaces/company.interface';
import { SearchableSelect } from './SearchableSelect';
import { useHasPermission } from '@/libs/shared/hooks/useHasPermission';

interface Province {
  id: number;
  name: string;
}

interface FilterItem {
  id: number;
  name: string;
  code?: string;
}

interface ImportCompanyPreviewItem {
  rowNumber: number;
  businessName: string;
  taxCode: string;
  businessType: string;
  businessIndustry: string;
  licenseIssueDate: string | null;
  licenseRegistrationProvince: string;
  licenseRegistrationWard: string;
  licenseRegistrationAddress: string | null;
  foreignBusinessName: string | null;
  email: string;
  businessPhone: string | null;
  representativeName: string | null;
  representativePhone: string | null;
  businessOperatingProvince: string | null;
  businessOperatingWard: string | null;
  businessOperatingAddress: string | null;
  isValid: boolean;
  errors: string[];
}

export const CompanyList = () => {
  const router = useRouter();
  const { hasPermission } = useHasPermission();
  const colSpanCount = hasPermission('DELETE_COMPANY') ? 8 : 7;
  const searchParams = useSearchParams();
  const createdUser = searchParams?.get('createdUser');
  const createdPassword = searchParams?.get('createdPassword');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchName, setSearchName] = useState<string>('');
  const [searchTaxCode, setSearchTaxCode] = useState<string>('');

  const [businessTypes, setBusinessTypes] = useState<FilterItem[]>([]);
  const [businessIndustries, setBusinessIndustries] = useState<FilterItem[]>([]);

  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('');
  const [selectedBusinessIndustry, setSelectedBusinessIndustry] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [wardMap, setWardMap] = useState<Record<number, string>>({});

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchTaxCode, selectedWardId, selectedBusinessType, selectedBusinessIndustry, selectedStatus]);

  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<ImportCompanyPreviewItem[]>([]);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);

  const [selectedTaxCodes, setSelectedTaxCodes] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [formTaxCode, setFormTaxCode] = useState<string | undefined>(undefined);

  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [detailsData, setDetailsData] = useState<CompanyProfile | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [generatedAccount, setGeneratedAccount] = useState<{ username: string; password?: string } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [taxCodeToDelete, setTaxCodeToDelete] = useState<string>('');
  const [companyNameToDelete, setCompanyNameToDelete] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState<boolean>(false);

  const gpkdFileInputRef = React.useRef<HTMLInputElement>(null);
  const [gpkdUploadTaxCode, setGpkdUploadTaxCode] = useState<string | null>(null);
  const [isGpkdUploading, setIsGpkdUploading] = useState<boolean>(false);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ data?: { items: any[]; count: number } } & any>('/business');
      const responseData = response.data;
      const rawList = responseData?.data?.items || responseData?.items || (Array.isArray(responseData) ? responseData : []);

      const mappedList: Company[] = rawList.map((b: any) => ({
        id: b.id,
        accountId: b.id,
        companyName: b.name,
        foreignCompanyName: b.foreignName,
        taxCode: b.taxCode,
        businessTypeId: b.businessTypeId,
        businessIndustryId: b.businessIndustryId,
        licenseIssueDate: b.licenseDate,
        provinceDkkdId: b.registeredProvince,
        wardDkkdId: b.registeredDistrict,
        addressDkkd: b.address,
        businessPhone: b.officePhone,
        representativeName: b.representativeName,
        representativePhone: b.representativePhone,
        provinceHdkdId: b.operatingProvince,
        wardHdkdId: b.operatingDistrict,
        addressHdkd: b.businessLocation,
        gpkdFilePath: null,
        gtkFilePath: null,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        status: b.isActive ? 'ACTIVE' : 'INACTIVE',
        businessType: b.businessType,
        businessIndustry: b.businessIndustry,
      }));

      setCompanies(mappedList);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Không thể tải danh sách doanh nghiệp';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [btRes, biRes] = await Promise.all([
        api.get<{ data?: FilterItem[] } & FilterItem[]>('/business-types/all'),
        api.get<{ data?: FilterItem[] } & FilterItem[]>('/business-industries/roots'),
      ]);
      setBusinessTypes(btRes.data?.data || btRes.data || []);
      setBusinessIndustries(biRes.data?.data || biRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu lọc:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (createdUser && createdPassword) {
      setGeneratedAccount({ username: createdUser, password: createdPassword });
      setShowAccountModal(true);
      router.replace('/dashboard/companies');
    }
  }, [createdUser, createdPassword, router]);



  useEffect(() => {
    if (companies.length === 0) return;

    const uniqueProvinceIds = Array.from(
      new Set(
        companies
          .map((c) => c.provinceDkkdId)
          .filter((id): id is number => !!id)
      )
    );

    const fetchWardsForLoadedProvinces = async () => {
      const newWardMap = { ...wardMap };
      let updated = false;

      await Promise.all(
        uniqueProvinceIds.map(async (provId) => {
          try {
            const res = await api.get<{ id: number; name: string }[]>(`/location/provinces/${provId}/wards`);
            if (res.data) {
              res.data.forEach((ward) => {
                if (newWardMap[ward.id] !== ward.name) {
                  newWardMap[ward.id] = ward.name;
                  updated = true;
                }
              });
            }
          } catch (err) {
            console.error(`Lỗi tải phường xã giải quyết tên cho tỉnh ${provId}:`, err);
          }
        })
      );

      if (updated) {
        setWardMap(newWardMap);
      }
    };

    fetchWardsForLoadedProvinces();
  }, [companies]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDetailsModal(false);
      }
    };
    if (showDetailsModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDetailsModal]);

  const handleToggleStatus = async (taxCode: string, currentStatus: string) => {
    const isActivating = currentStatus !== 'ACTIVE';
    const company = companies.find((c) => c.taxCode === taxCode);
    if (!company) return;

    try {
      await api.patch(`/business/${company.id}`, { isActive: isActivating });
      setCompanies((prev) =>
        prev.map((c) => (c.taxCode === taxCode ? { ...c, status: isActivating ? 'ACTIVE' : 'INACTIVE' } : c))
      );
      toast.success(isActivating ? 'Đã kích hoạt lại doanh nghiệp!' : 'Đã khóa hoạt động doanh nghiệp!');
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái doanh nghiệp');
    }
  };

  const handleViewDetails = async (taxCode: string) => {
    setIsLoadingDetails(true);
    setShowDetailsModal(true);
    const company = companies.find((c) => c.taxCode === taxCode);
    if (!company) {
      setShowDetailsModal(false);
      setIsLoadingDetails(false);
      return;
    }

    try {
      const res = await api.get<{ data?: any } & any>(`/business/${company.id}`);
      const b = res.data?.data || res.data;
      if (b) {
        setDetailsData({
          taxCode: b.taxCode,
          companyName: b.name,
          foreignCompanyName: b.foreignName,
          licenseIssueDate: b.licenseDate,
          businessType: b.businessType?.name || '—',
          businessIndustry: b.businessIndustry?.name || '—',
          email: b.email,
          status: b.isActive ? 'ACTIVE' : 'INACTIVE',
          provinceDKKD: b.registeredProvince,
          wardDKKD: b.registeredDistrict,
          addressDKKD: b.address,
          provinceHDKD: b.operatingProvince,
          wardHDKD: b.operatingDistrict,
          addressHDKD: b.businessLocation,
          representativeName: b.representativeName,
          representativePhone: b.representativePhone,
          businessPhone: b.officePhone,
          gpkdFile: null,
          gtkFile: null,
        });
      }
    } catch (err) {
      console.error('Lỗi lấy chi tiết doanh nghiệp:', err);
      toast.error('Không thể tải chi tiết doanh nghiệp');
      setShowDetailsModal(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const uniqueWards = Array.from(
    new Set(
      companies
        .map((c) => c.wardDkkdId)
        .filter((id): id is number => !!id)
    )
  ).map((id) => ({
    id,
    name: wardMap[id] || `Phường/Xã #${id}`,
  })).sort((a, b) => a.name.localeCompare(b.name));

  const filteredCompanies = companies.filter((company) => {
    const nameTerm = searchName.toLowerCase().trim();
    if (nameTerm) {
      const nameMatch = company.companyName?.toLowerCase().includes(nameTerm);
      if (!nameMatch) return false;
    }

    const taxTerm = searchTaxCode.toLowerCase().trim();
    if (taxTerm) {
      const taxMatch = company.taxCode?.toLowerCase().includes(taxTerm);
      if (!taxMatch) return false;
    }

    if (selectedWardId) {
      if (String(company.wardDkkdId) !== selectedWardId) {
        return false;
      }
    }

    if (selectedBusinessType) {
      if (company.businessType?.name !== selectedBusinessType) {
        return false;
      }
    }

    if (selectedBusinessIndustry) {
      if (company.businessIndustry?.name !== selectedBusinessIndustry) {
        return false;
      }
    }

    if (selectedStatus) {
      if (company.status !== selectedStatus) {
        return false;
      }
    }

    return true;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));

  const handleOpenResetModal = (taxCode: string, companyName: string) => {
    setSelectedTaxCode(taxCode);
    setSelectedCompanyName(companyName);
    setNewPassword('');
    setShowPassword(false);
    setShowResetModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Mật khẩu phải từ 8 ký tự trở lên');
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      toast.error('Mật khẩu phải gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      return;
    }

    setIsResetting(true);

    try {
      const response = await api.post<{ message?: string }>('/company/reinitialize-password', {
        tax_code: selectedTaxCode,
        password: newPassword,
      });

      toast.success(response.data?.message || 'Khởi tạo lại mật khẩu thành công!');
      setShowResetModal(false);
      
      try {
        await navigator.clipboard.writeText(newPassword);
        toast.success('Đã sao chép mật khẩu mới vào clipboard');
      } catch (clipErr) {
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Khởi tạo lại mật khẩu thất bại';
      toast.error(msg);
    } finally {
      setIsResetting(false);
    }
  };

  const handleGeneratePassword = () => {
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-';
    
    let generated = '';
    generated += uppers.charAt(Math.floor(Math.random() * uppers.length));
    generated += lowers.charAt(Math.floor(Math.random() * lowers.length));
    generated += numbers.charAt(Math.floor(Math.random() * numbers.length));
    generated += symbols.charAt(Math.floor(Math.random() * symbols.length));

    const allChars = uppers + lowers + numbers + symbols;
    for (let i = 0; i < 6; i++) {
      generated += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    setNewPassword(generated);
  };

  const handleOpenDeleteModal = (taxCode: string, companyName: string) => {
    setTaxCodeToDelete(taxCode);
    setCompanyNameToDelete(companyName);
    setShowDeleteModal(true);
  };

  const handleDeleteCompany = async () => {
    const target = companies.find((c) => c.taxCode === taxCodeToDelete);
    if (!target) return;
    setIsDeleting(true);
    try {
      await api.delete(`/business/${target.id}`);
      toast.success('Xóa doanh nghiệp thành công!');
      setShowDeleteModal(false);
      fetchCompanies();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Xóa doanh nghiệp thất bại';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGpkdUploadClick = (taxCode: string) => {
    toast('Chức năng tải file đính kèm đang được hoàn thiện ở Backend', { icon: 'ℹ️' });
  };

  const handleGpkdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Không bắt buộc tải file
  };

  const handleBatchDelete = async () => {
    if (selectedTaxCodes.length === 0) return;

    setIsBatchDeleting(true);
    const toastId = toast.loading(`Đang xóa ${selectedTaxCodes.length} doanh nghiệp...`);

    try {
      const targets = companies.filter((c) => selectedTaxCodes.includes(c.taxCode));
      await Promise.all(
        targets.map((c) => api.delete(`/business/${c.id}`))
      );
      toast.success(`Đã xóa thành công ${selectedTaxCodes.length} doanh nghiệp!`, { id: toastId });
      setSelectedTaxCodes([]);
      setShowBatchDeleteModal(false);
      fetchCompanies();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Có lỗi xảy ra khi xóa các doanh nghiệp';
      toast.error(msg, { id: toastId });
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/company/import/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mau_import_doanh_nghiep.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Đã tải xuống file Excel mẫu!');
    } catch (err) {
      console.error('Lỗi tải file mẫu:', err);
      toast.error('Không thể tải xuống file Excel mẫu');
    }
  };

  const handlePreviewExcel = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Vui lòng chọn file Excel');
      return;
    }

    setIsPreviewing(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await api.post<{
        data?: {
          summary: {
            totalRows: number;
            validRows: number;
            invalidRows: number;
            canImport: boolean;
          };
          items: ImportCompanyPreviewItem[];
        };
        message?: string;
      }>('/company/import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const items = response.data?.data?.items || [];
      setPreviewData(items);
      setSelectedPreviewIndex(0);
      toast.success(response.data?.message || `Đọc thành công ${items.length} dòng dữ liệu xem trước!`);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const backendMessage = axiosError.response?.data?.message;
      const errorMsg = Array.isArray(backendMessage) 
        ? backendMessage[0] 
        : (backendMessage || 'Không thể đọc file preview');
      toast.error(errorMsg);
      setPreviewData([]);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImportExcel = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Vui lòng chọn file Excel');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await api.post<{
        data?: {
          total: number;
          successCount: number;
          errorCount: number;
          errors: { row: number; reason: string }[];
        };
        message?: string;
      }>('/company/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const importResult = response.data?.data;
      
      if (!importResult) {
        toast.success('Nhập dữ liệu doanh nghiệp từ Excel hoàn tất!');
        setShowImportModal(false);
        setImportFile(null);
        setPreviewData([]);
        fetchCompanies();
        return;
      }

      if (importResult.successCount === 0) {
        const firstErr = importResult.errors?.[0];
        const errorDetail = firstErr ? ` (Dòng ${firstErr.row}: ${firstErr.reason})` : '';
        toast.error(`Nhập dữ liệu thất bại: Không có dòng nào thành công.${errorDetail}`, { duration: 6000 });
        return;
      }

      if (importResult.errorCount > 0) {
        toast.success(`Nhập dữ liệu hoàn tất: Thành công ${importResult.successCount}/${importResult.total} dòng. Có ${importResult.errorCount} dòng lỗi.`, { duration: 6000 });
        setShowImportModal(false);
        setImportFile(null);
        setPreviewData([]);
        fetchCompanies();
        return;
      }

      toast.success('Nhập dữ liệu doanh nghiệp từ Excel thành công!');
      setShowImportModal(false);
      setImportFile(null);
      setPreviewData([]);
      fetchCompanies();
    } catch (err: unknown) {
      console.error('Lỗi nhập dữ liệu từ Excel:', err);
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const msg = axiosError.response?.data?.message || 'Nhập dữ liệu thất bại. Vui lòng kiểm tra lại cấu trúc file!';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F4F6F9] min-h-screen">
        <div className="text-sm font-medium text-gray-500 animate-pulse">
          Đang tải danh sách doanh nghiệp từ hệ thống...
        </div>
      </div>
    );
  }



  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Hệ thống</span>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-800">Danh sách doanh nghiệp</h1>
        </div>
        
        <div className="flex items-center gap-2.5">
          {hasPermission('CREATE_COMPANY') && (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="px-4 py-1.5 border border-emerald-600 hover:bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 bg-white cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Nhập từ Excel
            </button>
          )}
          {hasPermission('CREATE_COMPANY') && (
            <button
              type="button"
              onClick={() => {
                router.push('/dashboard/companies/create');
              }}
              className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Thêm mới
            </button>
          )}
          {hasPermission('DELETE_COMPANY') && (
            <button
              type="button"
              onClick={() => router.push('/dashboard/companies/deleted')}
              className="px-4 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Doanh nghiệp đã xóa
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-normal text-[10px]">
                  {hasPermission('DELETE_COMPANY') && (
                    <th className="py-3 px-2 text-center w-10">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={paginatedCompanies.length > 0 && paginatedCompanies.every(c => selectedTaxCodes.includes(c.taxCode))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaxCodes(paginatedCompanies.map(c => c.taxCode));
                            } else {
                              setSelectedTaxCodes([]);
                            }
                          }}
                          className="w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                        />
                      </div>
                    </th>
                  )}
                  <th className="py-3 px-2 w-24 text-center">Thao tác</th>
                  <th className="py-3 px-3 w-28">Mã số thuế</th>
                  <th className="py-3 px-3 w-64">Tên doanh nghiệp</th>
                  <th className="py-3 px-3 w-36">Phường/Xã</th>
                  <th className="py-3 px-3 min-w-[140px]">Loại hình</th>
                  <th className="py-3 px-3 min-w-[160px]">Ngành nghề</th>
                  <th className="py-3 px-2 w-24 text-center">Trạng thái</th>
                </tr>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {hasPermission('DELETE_COMPANY') && <th className="py-2 px-2"></th>}
                  
                  <th className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchName('');
                        setSearchTaxCode('');
                        setSelectedWardId('');
                        setSelectedBusinessType('');
                        setSelectedBusinessIndustry('');
                        setSelectedStatus('');
                        toast.success('Đã xóa tất cả bộ lọc');
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500 rounded hover:bg-gray-200/50 transition-colors cursor-pointer"
                      title="Xóa tất cả bộ lọc"
                    >
                      <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  </th>
                  
                  <th className="py-2 px-3">
                    <input
                      type="text"
                      value={searchTaxCode}
                      onChange={(e) => setSearchTaxCode(e.target.value)}
                      placeholder="Tìm MST..."
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-800 placeholder-gray-450 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>
                  
                  <th className="py-2 px-3">
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="Tìm tên DN..."
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-800 placeholder-gray-450 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>
                  
                  <th className="py-2 px-3 text-left">
                    <SearchableSelect
                      options={uniqueWards.map((w) => ({ value: String(w.id), label: w.name }))}
                      value={selectedWardId}
                      onChange={(val) => setSelectedWardId(val)}
                      placeholder="Phường/Xã"
                      size="sm"
                    />
                  </th>
                  
                  <th className="py-2 px-3">
                    <select
                      value={selectedBusinessType}
                      onChange={(e) => setSelectedBusinessType(e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Loại hình</option>
                      {businessTypes.map((bt) => (
                        <option key={bt.id} value={bt.name}>
                          {bt.name}
                        </option>
                      ))}
                    </select>
                  </th>
                  
                  <th className="py-2 px-3 text-left">
                    <SearchableSelect
                      options={businessIndustries.map((bi) => ({ value: bi.name, label: bi.code ? `${bi.code} - ${bi.name}` : bi.name }))}
                      value={selectedBusinessIndustry}
                      onChange={(val) => setSelectedBusinessIndustry(val)}
                      placeholder="Ngành nghề"
                      size="sm"
                    />
                  </th>
                  
                  <th className="py-2 px-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-1 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Trạng thái</option>
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="PENDING">Chờ duyệt</option>
                      <option value="INACTIVE">Khóa</option>
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={colSpanCount} className="py-8 text-center text-gray-400 font-medium">
                      Không tìm thấy doanh nghiệp nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map((company, index) => (
                    <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                      {hasPermission('DELETE_COMPANY') && (
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedTaxCodes.includes(company.taxCode)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTaxCodes(prev => [...prev, company.taxCode]);
                                } else {
                                  setSelectedTaxCodes(prev => prev.filter(c => c !== company.taxCode));
                                }
                              }}
                              className="w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                            />
                          </div>
                        </td>
                      )}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasPermission('VIEW_COMPANY') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(company.taxCode);
                              }}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Xem chi tiết doanh nghiệp"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                          )}

                          {hasPermission('UPDATE_COMPANY') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/companies/edit/${company.taxCode}`);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Chỉnh sửa doanh nghiệp"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                          )}

                          {hasPermission('UPDATE_COMPANY') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenResetModal(company.taxCode, company.companyName);
                              }}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              title="Khởi tạo lại mật khẩu"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{company.taxCode}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-900 leading-relaxed">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{company.companyName}</span>
                            {!company.gpkdFilePath && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Chưa có GPKD
                              </span>
                            )}
                          </div>
                          {company.foreignCompanyName && (
                            <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                              {company.foreignCompanyName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 truncate max-w-[140px]" title={wardMap[company.wardDkkdId]}>
                        {wardMap[company.wardDkkdId] || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 truncate max-w-[150px]" title={company.businessType?.name}>
                        {company.businessType?.name || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 truncate max-w-[170px]" title={company.businessIndustry?.name}>
                        {company.businessIndustry?.name || '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center">
                          {hasPermission('BAN_COMPANY') ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(company.taxCode, company.status);
                              }}
                              className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                                company.status === 'ACTIVE' ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                              }`}
                              title="Bật/Tắt trạng thái hoạt động"
                            >
                              <span className="bg-white w-3 h-3 rounded-full shadow-md" />
                            </button>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              company.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : company.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-gray-50 text-gray-400 border-gray-200'
                            }`}>
                              {company.status === 'ACTIVE' ? 'Hoạt động' : company.status === 'PENDING' ? 'Chờ duyệt' : 'Bị khóa'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>dòng mỗi trang</span>
            </div>

            <div className="text-gray-500 font-medium">
              Hiển thị {filteredCompanies.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, filteredCompanies.length)} của {filteredCompanies.length} doanh nghiệp
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 bg-white shadow-sm font-semibold cursor-pointer"
              >
                ❮ Trước
              </button>
              
              <span className="font-semibold text-gray-750">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 bg-white shadow-sm font-semibold cursor-pointer"
              >
                Sau ❯
              </button>
            </div>
          </div>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl overflow-hidden animate-fadeIn text-gray-700">
            <div className="bg-[#2F6BFF] text-white text-center py-4 font-bold text-sm uppercase tracking-wider">
              Khởi tạo mật khẩu mới
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-5">
              <div className="text-xs space-y-1 bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-gray-600 leading-relaxed">
                <div>Doanh nghiệp: <span className="font-bold text-gray-800">{selectedCompanyName}</span></div>
                <div>Mã số thuế: <span className="font-semibold text-gray-800">{selectedTaxCode}</span></div>
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-gray-400 select-none z-10">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới hoặc click tự tạo"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-xs text-gray-900 placeholder-gray-300 pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[#2F6BFF] hover:text-blue-700 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                    >
                      Tự tạo
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 leading-relaxed">
                Mật khẩu phải dài ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-blue-400"
                >
                  {isResetting ? 'Đang thực hiện...' : 'Khởi tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className={`bg-white rounded-2xl w-full shadow-2xl overflow-hidden animate-fadeIn text-gray-700 transition-all ${
            previewData.length > 0 ? 'max-w-6xl h-[85vh] flex flex-col' : 'max-w-[440px]'
          }`}>
            {previewData.length > 0 ? (
              <>
                <div className="bg-[#2F6BFF] text-white py-4 px-6 font-bold text-sm uppercase tracking-wider flex items-center justify-between flex-shrink-0 select-none">
                  <span>Xem trước danh sách dữ liệu doanh nghiệp từ file Excel</span>
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
                    Tổng cộng: {previewData.length} dòng
                  </span>
                </div>

                <div className="flex-1 flex overflow-hidden min-h-0 min-w-0">
                  
                  <div className="w-80 border-r border-gray-200 overflow-y-auto bg-gray-50/50 p-4 space-y-2 flex-shrink-0 scrollbar-thin">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2 select-none">
                      Danh sách hàng trong file
                    </span>
                    <div className="space-y-1.5">
                      {previewData.map((item, index) => {
                        const isSelected = selectedPreviewIndex === index;
                        return (
                          <div
                            key={index}
                            onClick={() => setSelectedPreviewIndex(index)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-400">Dòng {item.rowNumber}</span>
                                {!item.isValid && (
                                  <span className="bg-red-50 text-red-600 border border-red-200 px-1 py-0.5 rounded text-[9px] font-bold">Lỗi</span>
                                )}
                              </div>
                              <div className="font-semibold text-gray-800 truncate mt-1" title={item.businessName}>
                                {item.businessName || '—'}
                              </div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                MST: {item.taxCode || '—'}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {item.isValid ? (
                                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">✓</span>
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold">✕</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6 scrollbar-thin">
                    {previewData[selectedPreviewIndex] && (() => {
                      const item = previewData[selectedPreviewIndex];
                      return (
                        <div className="space-y-6">
                          
                          {!item.isValid && item.errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1.5">
                              <h4 className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-red-650" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Chi tiết lỗi kiểm tra:
                              </h4>
                              <ul className="list-disc list-inside text-[11px] text-red-750 leading-normal pl-1 space-y-1">
                                {item.errors.map((errText, idx) => (
                                  <li key={idx}>{errText}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {item.isValid && (
                            <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">✓</span>
                              Dữ liệu dòng này hợp lệ và sẵn sàng nhập.
                            </div>
                          )}

                          <div>
                            <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2.5 tracking-wide select-none">
                              1. Thông tin pháp lý & ĐKKD
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs mt-3.5">
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Tên doanh nghiệp:</span>
                                <span className="font-semibold text-gray-800 leading-normal">{item.businessName || '—'}</span>
                              </div>
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Mã số thuế:</span>
                                <span className="font-semibold text-gray-800">{item.taxCode || '—'}</span>
                              </div>
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Tên tiếng nước ngoài:</span>
                                <span className="font-semibold text-gray-800 leading-normal">{item.foreignBusinessName || '—'}</span>
                              </div>
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Loại hình doanh nghiệp:</span>
                                <span className="font-semibold text-gray-800">{item.businessType || '—'}</span>
                              </div>
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Ngành nghề kinh doanh:</span>
                                <span className="font-semibold text-gray-800 leading-normal">{item.businessIndustry || '—'}</span>
                              </div>
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Ngày cấp GPKD:</span>
                                <span className="font-semibold text-gray-800">
                                  {item.licenseIssueDate ? formatDisplayDate(item.licenseIssueDate) : '—'}
                                </span>
                              </div>
                              <div className="flex flex-col py-0.5 md:col-span-2">
                                <span className="text-gray-400 font-medium mb-1 select-none">Địa chỉ đăng ký kinh doanh:</span>
                                <span className="font-semibold text-gray-800 leading-normal">
                                  {`${item.licenseRegistrationAddress || ''}, ${item.licenseRegistrationWard || ''}, ${item.licenseRegistrationProvince || ''}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2.5 tracking-wide mt-2 select-none">
                              2. Thông tin liên hệ & HĐKD
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs mt-3.5">
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Email doanh nghiệp:</span>
                                <span className="font-semibold text-gray-800">{item.email || '—'}</span>
                              </div>
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Điện thoại doanh nghiệp:</span>
                                <span className="font-semibold text-gray-800">{item.businessPhone || '—'}</span>
                              </div>
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Người đại diện pháp luật:</span>
                                <span className="font-semibold text-gray-800 leading-normal">{item.representativeName || '—'}</span>
                              </div>
                              <div className="flex flex-col py-0.5">
                                <span className="text-gray-400 font-medium mb-1 select-none">Điện thoại người đại diện:</span>
                                <span className="font-semibold text-gray-800">{item.representativePhone || '—'}</span>
                              </div>
                              <div className="flex flex-col py-0.5 md:col-span-2">
                                <span className="text-gray-400 font-medium mb-1 select-none">Địa chỉ hoạt động kinh doanh:</span>
                                <span className="font-semibold text-gray-800 leading-normal">
                                  {item.businessOperatingProvince 
                                    ? `${item.businessOperatingAddress || ''}, ${item.businessOperatingWard || ''}, ${item.businessOperatingProvince || ''}`
                                    : '—'}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                </div>

                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setImportFile(null);
                      setPreviewData([]);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Hủy bỏ file
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                        setPreviewData([]);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      onClick={handleImportExcel}
                      disabled={isImporting || previewData.some((item) => !item.isValid)}
                      className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-blue-400 cursor-pointer flex items-center gap-1.5"
                      title={previewData.some((item) => !item.isValid) ? 'File Excel có chứa lỗi dữ liệu, không thể import!' : ''}
                    >
                      {isImporting ? 'Đang nhập...' : 'Xác nhận nhập'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#2F6BFF] text-white text-center py-4 font-bold text-sm uppercase tracking-wider select-none">
                  Nhập doanh nghiệp từ Excel
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-6">
                  <div className="text-xs space-y-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-gray-600 leading-relaxed">
                    <p className="font-semibold text-emerald-800">Hướng dẫn nhập dữ liệu:</p>
                    <p>1. Tải về file mẫu Excel bên dưới.</p>
                    <p>2. Điền thông tin doanh nghiệp theo đúng các cột trong file mẫu.</p>
                    <p>3. Chọn file đã điền và nhấn "Nhập dữ liệu" để tải lên hệ thống.</p>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Tải xuống file Excel mẫu
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10.5px] font-semibold text-gray-400 block select-none">Chọn file Excel (.xlsx) <span className="text-red-500">*</span></span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors bg-white select-none">
                        Chọn file
                        <input
                          type="file"
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                          accept=".xlsx, .xls"
                          className="hidden"
                        />
                      </label>
                      {importFile && (
                         <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 text-xs">
                           <span className="text-gray-750 font-medium truncate max-w-[200px]" title={importFile.name}>
                             {importFile.name}
                           </span>
                           <button
                             type="button"
                             onClick={() => setImportFile(null)}
                             className="text-red-500 hover:text-red-700 font-bold px-1 hover:bg-gray-200/60 rounded transition-colors cursor-pointer"
                           >
                             ✕
                           </button>
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Huỷ bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handlePreviewExcel}
                      disabled={isPreviewing || !importFile}
                      className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-blue-400 cursor-pointer"
                    >
                      {isPreviewing ? 'Đang kiểm tra...' : 'Kiểm tra dữ liệu'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}


      {showAccountModal && generatedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-fadeIn text-gray-700">
            <div className="bg-[#2F6BFF] text-white text-center py-4 font-bold text-sm uppercase tracking-wider">
              Tài khoản doanh nghiệp mới
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 mb-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Tạo doanh nghiệp thành công!</h3>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Vui lòng lưu lại thông tin tài khoản đăng nhập dưới đây để bàn giao cho doanh nghiệp.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <span className="text-[10.5px] font-semibold text-gray-400 block mb-1">Tên đăng nhập (Mã số thuế)</span>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedAccount.username} 
                      className="w-full px-3 py-2 text-xs font-bold text-gray-800 bg-transparent focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedAccount.username);
                        toast.success('Đã sao chép tên đăng nhập!');
                      }}
                      className="px-3 py-2 text-blue-600 hover:bg-gray-200/50 border-l border-gray-200 cursor-pointer flex items-center justify-center transition-colors"
                      title="Sao chép tên đăng nhập"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10.5px] font-semibold text-gray-400 block mb-1">Mật khẩu mặc định</span>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedAccount.password || '12345678'} 
                      className="w-full px-3 py-2 text-xs font-bold text-gray-800 bg-transparent focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (generatedAccount.password) {
                          navigator.clipboard.writeText(generatedAccount.password);
                          toast.success('Đã sao chép mật khẩu!');
                        }
                      }}
                      className="px-3 py-2 text-blue-600 hover:bg-gray-200/50 border-l border-gray-200 cursor-pointer flex items-center justify-center transition-colors"
                      title="Sao chép mật khẩu"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="w-full py-2.5 bg-[#2F6BFF] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-scale-up text-gray-700">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Xác nhận xóa doanh nghiệp</h3>
                <div className="text-[11px] space-y-1 bg-red-50/50 p-3 rounded-lg border border-red-100 text-gray-600 leading-relaxed text-left">
                  <div>Doanh nghiệp: <span className="font-bold text-gray-800">{companyNameToDelete}</span></div>
                  <div>Mã số thuế: <span className="font-semibold text-gray-800">{taxCodeToDelete}</span></div>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Bạn có chắc chắn muốn xóa doanh nghiệp này? Hành động này sẽ thực hiện xóa mềm và vô hiệu hóa tài khoản doanh nghiệp.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-gray-255 cursor-pointer"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCompany}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-red-400 cursor-pointer"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-scale-up text-gray-700">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Xác nhận xóa doanh nghiệp</h3>
                <p className="text-xs text-gray-500 leading-normal">
                  Bạn có chắc chắn muốn xóa <span className="font-semibold text-red-600">{selectedTaxCodes.length}</span> doanh nghiệp đã chọn? Hành động này sẽ thực hiện xóa mềm và vô hiệu hóa tài khoản của các doanh nghiệp.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-gray-255 cursor-pointer"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="button"
                  onClick={handleBatchDelete}
                  disabled={isBatchDeleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-red-400 cursor-pointer"
                >
                  {isBatchDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity duration-300 ease-out"
            onClick={() => setShowDetailsModal(false)}
          />
          
          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-full max-w-lg md:max-w-xl bg-white shadow-2xl flex flex-col divide-y divide-gray-100 animate-slideInRight">
              
              <div className="px-6 py-5 bg-gray-50 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Chi tiết doanh nghiệp</h2>
                  <p className="mt-1 text-xs text-gray-500">Mã số thuế: {detailsData?.taxCode}</p>
                </div>
                <div className="flex items-center gap-3">
                  {detailsData && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      detailsData.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : detailsData.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {detailsData.status === 'ACTIVE' ? 'Hoạt động' : detailsData.status === 'PENDING' ? 'Chờ duyệt' : 'Bị khóa'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700 scrollbar-thin">
                {isLoadingDetails ? (
                  <div className="py-24 flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 font-medium animate-pulse">Đang tải thông tin...</span>
                  </div>
                ) : detailsData ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-4">
                      <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Thông tin pháp lý & ĐKKD
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Tên doanh nghiệp:</span>
                          <span className="font-semibold text-gray-800 leading-normal">{detailsData.companyName}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Tên tiếng nước ngoài:</span>
                          <span className="font-semibold text-gray-800 leading-normal">{detailsData.foreignCompanyName || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Loại hình doanh nghiệp:</span>
                          <span className="font-semibold text-gray-800">{detailsData.businessType}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Ngày cấp GPKD:</span>
                          <span className="font-semibold text-gray-800">
                            {detailsData.licenseIssueDate ? formatDisplayDate(detailsData.licenseIssueDate) : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Ngành nghề kinh doanh:</span>
                          <span className="font-semibold text-gray-800">{detailsData.businessIndustry}</span>
                        </div>
                        <div className="flex flex-col md:col-span-2">
                          <span className="text-gray-400 font-medium mb-1">Địa chỉ đăng ký kinh doanh:</span>
                          <span className="font-semibold text-gray-800 leading-normal">
                            {`${detailsData.addressDKKD || ''}, ${detailsData.wardDKKD || ''}, ${detailsData.provinceDKKD || ''}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-4">
                      <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.14-4.118-6.944-6.94l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        Thông tin liên hệ & HĐKD
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Email doanh nghiệp:</span>
                          <span className="font-semibold text-gray-800">{detailsData.email}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Điện thoại doanh nghiệp:</span>
                          <span className="font-semibold text-gray-800">{detailsData.businessPhone || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Người đại diện pháp luật:</span>
                          <span className="font-semibold text-gray-800">{detailsData.representativeName || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Điện thoại người đại diện:</span>
                          <span className="font-semibold text-gray-800">{detailsData.representativePhone || '—'}</span>
                        </div>
                        <div className="flex flex-col md:col-span-2">
                          <span className="text-gray-400 font-medium mb-1">Địa chỉ hoạt động kinh doanh:</span>
                          <span className="font-semibold text-gray-800 leading-normal">
                            {detailsData.provinceHDKD
                              ? `${detailsData.addressHDKD || ''}, ${detailsData.wardHDKD || ''}, ${detailsData.provinceHDKD || ''}`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-4">
                      <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0A7.5 7.5 0 115.636 18.364m9.192-9.192l-5.656 5.656m0 0l-3.03-3.029m5.686 3.03L18.364 5.636" />
                        </svg>
                        Tài liệu & Đính kèm
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Giấy phép kinh doanh (file):</span>
                          {detailsData.gpkdFile ? (
                            <a
                              href={detailsData.gpkdFile.startsWith('http') ? detailsData.gpkdFile : `http://localhost:8080/uploads/${detailsData.gpkdFile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 hover:shadow-xs transition-all w-fit max-w-full"
                            >
                              <span className="truncate max-w-[200px]">{detailsData.gpkdFile}</span>
                              <svg className="w-3.5 h-3.5 inline flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </a>
                          ) : (
                            <span className="font-semibold text-gray-500">—</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-medium mb-1">Tài liệu khác đính kèm:</span>
                          {detailsData.gtkFile ? (
                            <a
                              href={detailsData.gtkFile.startsWith('http') ? detailsData.gtkFile : `http://localhost:8080/uploads/${detailsData.gtkFile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 hover:shadow-xs transition-all w-fit max-w-full"
                            >
                              <span className="truncate max-w-[200px]">{detailsData.gtkFile}</span>
                              <svg className="w-3.5 h-3.5 inline flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </a>
                          ) : (
                            <span className="font-semibold text-gray-500">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-red-500 font-semibold">
                    Lỗi tải thông tin chi tiết
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl border border-gray-300 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                {detailsData && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsModal(false);
                      router.push(`/dashboard/companies/edit/${detailsData.taxCode}`);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Chỉnh sửa
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={gpkdFileInputRef}
        onChange={handleGpkdFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />

      {selectedTaxCodes.length > 0 && hasPermission('DELETE_COMPANY') && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-150 flex items-center h-12 overflow-hidden z-50 animate-fade-in pr-4">
          <div className="bg-[#2F6BFF] text-white w-12 h-full flex items-center justify-center font-bold text-sm">
            {selectedTaxCodes.length}
          </div>
          
          <div className="px-4 text-gray-800 font-medium text-xs whitespace-nowrap">
            dữ liệu được chọn
          </div>
          
          <button
            type="button"
            disabled={isBatchDeleting}
            onClick={() => setShowBatchDeleteModal(true)}
            className="bg-[#FF3B30] hover:bg-[#E03026] disabled:opacity-50 text-white rounded-lg h-8 px-3.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-3 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Xóa
          </button>

          <div className="w-px h-6 bg-gray-200 mr-3" />

          <button
            type="button"
            onClick={() => setSelectedTaxCodes([])}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-center"
            title="Bỏ chọn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
};
