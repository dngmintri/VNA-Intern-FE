'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/libs/core/api/axios';
import { AxiosError } from 'axios';
import { Company } from '../interfaces/company.interface';
import { useHasPermission } from '@/libs/shared/hooks/useHasPermission';

interface CompanyDeletedProps {
  onBack: () => void;
}

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

export const CompanyDeleted = ({ onBack }: CompanyDeletedProps) => {
  const { hasPermission } = useHasPermission();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchName, setSearchName] = useState<string>('');
  const [searchTaxCode, setSearchTaxCode] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [selectedTaxCodes, setSelectedTaxCodes] = useState<string[]>([]);

  const [wardMap, setWardMap] = useState<Record<number, string>>({});

  const [showSingleRestoreModal, setShowSingleRestoreModal] = useState<boolean>(false);
  const [taxCodeToRestore, setTaxCodeToRestore] = useState<string>('');
  const [companyNameToRestore, setCompanyNameToRestore] = useState<string>('');
  const [isRestoringSingle, setIsRestoringSingle] = useState<boolean>(false);

  const [showBatchRestoreModal, setShowBatchRestoreModal] = useState<boolean>(false);
  const [isRestoringBatch, setIsRestoringBatch] = useState<boolean>(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedTaxCodes([]);
  }, [searchName, searchTaxCode]);

  const fetchDeletedCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Company[]>('/company/deleted-companies');
      if (response.data) {
        setCompanies(response.data);
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không thể tải danh sách doanh nghiệp đã xóa');
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedCompanies();
  }, []);

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

  const handleOpenSingleRestore = (taxCode: string, companyName: string) => {
    setTaxCodeToRestore(taxCode);
    setCompanyNameToRestore(companyName);
    setShowSingleRestoreModal(true);
  };

  const executeSingleRestore = async () => {
    if (!taxCodeToRestore) return;
    setIsRestoringSingle(true);
    const toastId = toast.loading(`Đang khôi phục doanh nghiệp ${taxCodeToRestore}...`);
    try {
      await api.patch(`/company/${taxCodeToRestore}/restore`);
      toast.success('Khôi phục doanh nghiệp thành công!', { id: toastId });
      setShowSingleRestoreModal(false);
      setTaxCodeToRestore('');
      setCompanyNameToRestore('');
      fetchDeletedCompanies();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Khôi phục doanh nghiệp thất bại';
      toast.error(msg, { id: toastId });
    } finally {
      setIsRestoringSingle(false);
    }
  };

  const executeBatchRestore = async () => {
    if (selectedTaxCodes.length === 0) return;
    setIsRestoringBatch(true);
    const toastId = toast.loading(`Đang khôi phục ${selectedTaxCodes.length} doanh nghiệp...`);
    try {
      await Promise.all(
        selectedTaxCodes.map((taxCode) => api.patch(`/company/${taxCode}/restore`))
      );
      toast.success(`Khôi phục thành công ${selectedTaxCodes.length} doanh nghiệp!`, { id: toastId });
      setSelectedTaxCodes([]);
      setShowBatchRestoreModal(false);
      fetchDeletedCompanies();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Khôi phục doanh nghiệp thất bại';
      toast.error(msg, { id: toastId });
    } finally {
      setIsRestoringBatch(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (searchName.trim() && !c.companyName?.toLowerCase().includes(searchName.toLowerCase().trim())) return false;
    if (searchTaxCode.trim() && !c.taxCode?.toLowerCase().includes(searchTaxCode.toLowerCase().trim())) return false;
    return true;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans text-xs">
      
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Hệ thống</span>
          <span className="text-xs text-gray-400">❯</span>
          <span className="text-xs font-semibold text-gray-500 cursor-pointer hover:underline" onClick={onBack}>Danh sách doanh nghiệp</span>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            Danh sách doanh nghiệp đã xóa
          </h1>
        </div>
        
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 bg-white cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-normal text-[10px]">
                  <th className="py-3 px-2 text-center w-10">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={paginatedCompanies.length > 0 && paginatedCompanies.every((c) => selectedTaxCodes.includes(c.taxCode))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaxCodes(paginatedCompanies.map((c) => c.taxCode));
                          } else {
                            setSelectedTaxCodes([]);
                          }
                        }}
                        disabled={!hasPermission('DELETE_COMPANY')}
                        className={`w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer align-middle ${
                          !hasPermission('DELETE_COMPANY') ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                        }`}
                      />
                    </div>
                  </th>
                  <th className="py-3 px-2 w-24 text-center">Thao tác</th>
                  <th className="py-3 px-3 w-28">Mã số thuế</th>
                  <th className="py-3 px-3 w-64">Tên doanh nghiệp</th>
                  <th className="py-3 px-3 w-36">Phường/Xã</th>
                  <th className="py-3 px-3 min-w-[140px]">Loại hình</th>
                  <th className="py-3 px-3 min-w-[160px]">Ngành nghề</th>
                </tr>
                
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-2 px-2"></th>
                  <th className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchName('');
                        setSearchTaxCode('');
                        toast.success('Đã làm mới bộ lọc!');
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200/50 transition-colors flex items-center justify-center mx-auto"
                      title="Xóa bộ lọc"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  </th>
                  <th className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Lọc mã số thuế..."
                      value={searchTaxCode}
                      onChange={(e) => setSearchTaxCode(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] bg-white text-gray-700 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </th>
                  <th className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Lọc tên doanh nghiệp..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] bg-white text-gray-700 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </th>
                  <th className="py-2 px-3" colSpan={3}></th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-400 font-medium">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải danh sách...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 font-semibold">
                      Không tìm thấy doanh nghiệp nào đã xóa
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedTaxCodes.includes(company.taxCode)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTaxCodes((prev) => [...prev, company.taxCode]);
                              } else {
                                setSelectedTaxCodes((prev) => prev.filter((code) => code !== company.taxCode));
                              }
                            }}
                            disabled={!hasPermission('DELETE_COMPANY')}
                            className={`w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer align-middle ${
                              !hasPermission('DELETE_COMPANY') ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSingleRestore(company.taxCode, company.companyName);
                            }}
                            disabled={!hasPermission('DELETE_COMPANY')}
                            className={`p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer ${
                              !hasPermission('DELETE_COMPANY') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                            }`}
                            title="Khôi phục doanh nghiệp"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{company.taxCode}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-900 leading-relaxed">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{company.companyName}</span>
                          </div>
                          {company.foreignCompanyName && (
                            <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                              {company.foreignCompanyName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-650 truncate max-w-[140px]" title={wardMap[company.wardDkkdId]}>
                        {wardMap[company.wardDkkdId] || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-550 truncate max-w-[150px]" title={company.businessType?.name}>
                        {company.businessType?.name || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 truncate max-w-[170px]" title={company.businessIndustry?.name}>
                        {company.businessIndustry?.name || '—'}
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

      {showSingleRestoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-scale-up text-gray-700">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Xác nhận khôi phục doanh nghiệp</h3>
                <div className="text-[11px] space-y-1 bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-gray-600 leading-relaxed text-left">
                  <div>Doanh nghiệp: <span className="font-bold text-gray-800">{companyNameToRestore}</span></div>
                  <div>Mã số thuế: <span className="font-semibold text-gray-800">{taxCodeToRestore}</span></div>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Bạn có chắc chắn muốn khôi phục doanh nghiệp này? Tài khoản doanh nghiệp sẽ được mở khóa hoạt động trở lại.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSingleRestoreModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="button"
                  onClick={executeSingleRestore}
                  disabled={isRestoringSingle}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-blue-400 cursor-pointer"
                >
                  {isRestoringSingle ? 'Đang khôi phục...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBatchRestoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-scale-up text-gray-700">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Xác nhận khôi phục doanh nghiệp</h3>
                <p className="text-xs text-gray-500 leading-normal">
                  Bạn có chắc chắn muốn khôi phục <span className="font-semibold text-blue-600">{selectedTaxCodes.length}</span> doanh nghiệp đã chọn?
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchRestoreModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="button"
                  onClick={executeBatchRestore}
                  disabled={isRestoringBatch}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:bg-blue-400 cursor-pointer"
                >
                  {isRestoringBatch ? 'Đang khôi phục...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTaxCodes.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-150 flex items-center h-12 overflow-hidden z-50 animate-fade-in pr-4">
          <div className="bg-[#2F6BFF] text-white w-12 h-full flex items-center justify-center font-bold text-sm">
            {selectedTaxCodes.length}
          </div>
          
          <div className="px-4 text-gray-800 font-medium text-xs whitespace-nowrap">
            dữ liệu được chọn
          </div>
          
          <button
            type="button"
            disabled={isRestoringBatch || !hasPermission('DELETE_COMPANY')}
            onClick={() => setShowBatchRestoreModal(true)}
            className={`bg-[#34C759] hover:bg-[#2EB04F] disabled:opacity-50 text-white rounded-lg h-8 px-3.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-3 shadow-sm ${
              !hasPermission('DELETE_COMPANY') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Khôi phục
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
