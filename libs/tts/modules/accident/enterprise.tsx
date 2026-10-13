'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/libs/core/api/axios';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/libs/tts/store/auth.store';
import { decodeJwt } from '@/libs/shared/utils/jwt';

interface ReportPeriod {
  id: number;
  name: string;
  year: number;
  quarter: number | null;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}
interface BackendError {
  success: boolean;
  code: string;
  message: string[]; 
  errors: {
    message: string[];
    error: string;
    statusCode: number;
  };
  detail: string | null;
}
interface Report {
  id: number;
  companyId: number;
  reportPeriodId: number;
  reportType: 'TAI_NAN_LAO_DONG';
  content: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'WAITING' | string;
  totalEmployees: number | null;
  totalFemaleEmployees: number | null;
  totalSalaryFund: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  submittedAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  reportPeriod?: ReportPeriod; 
  company?: { companyName: string; taxCode: string };
}

interface CompanyProfileData {
  taxCode: string;
  companyName: string;
}

interface CompanyProfileResponse {
  data: CompanyProfileData;
  message?: string;
  statusCode?: number;
}

interface ReportPeriodApiResponse {
  data: {
    data: ReportPeriod[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message: string;
  statusCode: number;
}

interface JwtDecoded {
  username?: string;
}

export const Enterprise: React.FC = () => {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [allReports, setAllReports] = useState<Report[]>([]); 
  const [displayReports, setDisplayReports] = useState<Report[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState<Report | null>(null);
  const [years, setYears] = useState<number[]>([2026, 2025, 2024, 2023, 2022]); 
  const [selectedYear, setSelectedYear] = useState<string>('ALL'); 
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData | null>(null);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      const decoded = accessToken ? decodeJwt(accessToken) as JwtDecoded : null;
      const taxCode = decoded?.username || '';
      if (!taxCode) return;
      
      try {
        const profileRes = await api.get<CompanyProfileResponse>(`/company/${taxCode}/company-profile`);
        if (profileRes.data?.data) {
          setCompanyProfile(profileRes.data.data);
        }
      } catch (err) {
        console.error('Lỗi tải thông tin profile doanh nghiệp:', err);
      }
    };
    fetchCompanyProfile();
  }, [accessToken]);

useEffect(() => {
  const fetchYears = async () => {
    try {
      const response = await api.get<{ data: number[] }>('/report-periods/years');
      if (response.data?.data) {
        const sortedYears = response.data.data.sort((a, b) => b - a);
        setYears(sortedYears);
        if (sortedYears.length > 0 && selectedYear === 'ALL') {
           setSelectedYear(sortedYears[0].toString());
        }
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách năm:', error);
    }
  };
  fetchYears();
}, []);

useEffect(() => {
  const syncData = async () => {
    if (!selectedYear || selectedYear === 'ALL') return;
    
    setIsFetching(true);
    try {
      const [periodRes, reportRes] = await Promise.all([
        api.get<ReportPeriodApiResponse>(`/report-periods?year=${selectedYear}&limit=100`),
        api.get(`/reports/by-year/${selectedYear}`)
      ]);
      
      const activePeriods = periodRes.data?.data?.data || [];
      const userReports = reportRes.data?.data || []; 

      const combinedList = activePeriods.map((period: ReportPeriod) => {
        const found = userReports.find((r: Report) => r.reportPeriodId === period.id);
        return found ? { ...found, reportPeriod: period } : {
          id: -period.id, 
          companyId: 0,
          reportPeriodId: period.id,
          status: 'WAITING', 
          reportPeriod: period
        };
      });

      setDisplayReports(combinedList.sort((a, b) => b.reportPeriodId - a.reportPeriodId));
    } catch (error) {
      console.error('Lỗi đồng bộ dữ liệu:', error);
      toast.error('Không thể tải danh sách báo cáo');
    } finally {
      setIsFetching(false);
    }
  };

  syncData();
}, [selectedYear]);

  const handleActionSubmit = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn nộp báo cáo này không? Sau khi nộp dữ liệu sẽ bị khóa chặt!')) return;
    try {
      await api.patch<Report>(`/reports/${id}/submit`);
      toast.success('Nộp báo cáo định kỳ thành công!');
      setAllReports((prev: Report[]) =>
        prev.map((item: Report) => (item.id === id ? { ...item, status: 'SUBMITTED' } : item))
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Nộp báo cáo định kỳ thất bại!');
    }
  };
const handleInitializeReport = async (periodId: number) => {
  try {
    const MIN_VAL = 0;

    const payload = {
      report_period_id: periodId,
      company_info: {
        total_employees: 0,
        total_female_employees: 0,
        total_salary_fund: 0
      },
      general_statistic: {
        total_accidents: MIN_VAL,
        total_fatal_accidents: 0, 
        total_accidents_with_two_or_more_victims: 0,
        total_victims: MIN_VAL,
        total_female_victims: 0,
        total_fatalities: 0,
        total_seriously_injured: 0,
        unmanaged_victims: 0,
        unmanaged_female_victims: 0,
        unmanaged_fatalities: 0,
        unmanaged_seriously_injured: 0,
        medical_expenses: MIN_VAL,
        salary_paid_during_treatment: MIN_VAL,
        compensation_expenses: MIN_VAL,
        total_leave_days: MIN_VAL,
        property_damage_expenses: MIN_VAL
      },
      general_details: [],
      subsidized_statistic: {
        total_accidents: MIN_VAL,
        total_fatal_accidents: 0,
        total_accidents_with_two_or_more_victims: 0,
        total_victims: MIN_VAL,
        total_female_victims: 0,
        total_fatalities: 0,
        total_seriously_injured: 0,
        unmanaged_victims: 0,
        unmanaged_female_victims: 0,
        unmanaged_fatalities: 0,
        unmanaged_seriously_injured: 0,
        medical_expenses: MIN_VAL,
        salary_paid_during_treatment: MIN_VAL,
        compensation_expenses: MIN_VAL,
        total_leave_days: MIN_VAL,
        property_damage_expenses: MIN_VAL
      },
      subsidized_details: []
    };

    const response = await api.post('/reports', payload);
    
    toast.success('Đã khởi tạo báo cáo thành công!');
    router.push(`/dashboard/accidents-enterprise/edit/${response.data.id}`);

} catch (error) {
    const axiosError = error as AxiosError<BackendError>;
    
    const errorData = axiosError.response?.data;
    
    console.error('Lỗi chi tiết từ server:', errorData);
    
    const errorMessages = errorData?.message;
    
    toast.error(
      Array.isArray(errorMessages) && errorMessages.length > 0 
        ? errorMessages[0] 
        : 'Lỗi khởi tạo báo cáo'
    );
  }
}
  return (
    
<div className="w-full flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans ">
  
  <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-400">Tai nạn lao động</span>
      <span className="text-xs text-gray-400">❯</span>
      <h1 className="text-sm font-bold text-gray-800">TNLĐ theo HĐLĐ</h1>
    </div>
        <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-400 font-semibold">Năm:</span>
      <select 
        value={selectedYear} 
        onChange={(e) => setSelectedYear(e.target.value)} 
        className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-700 font-bold text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  </div>
    <div className="p-6 space-y-4 flex-1 flex flex-col justify-start">

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="w-full flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-normal text-[10px]">
                  <th className="py-3 px-4 w-32 text-center">Thao tác</th>
                  <th className="py-3 px-6 text-center min-w-[320px]">Tên doanh nghiệp</th>
                  <th className="py-3 px-6 w-48 text-center">Mã số thuế</th>
                  <th className="py-3 px-6 w-60 text-center">Kỳ báo cáo</th>
                  <th className="py-3 px-6 w-48 text-center">Trạng thái</th>
                </tr>
              </thead>    
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {isFetching ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-400 font-medium animate-pulse">
                        Đang đồng bộ dữ liệu hệ thống từ Sở...
                      </td>
                    </tr>
                  ) : displayReports.length > 0 ? (
                    displayReports.map((item: Report, index: number) => {
                      const isModifiable = item.status === 'DRAFT' || item.status === 'REJECTED';
                      const isWaiting = item.status === 'WAITING';
                      const periodName = item.reportPeriod?.name || `Kỳ báo cáo #${item.reportPeriodId}`;
                      const companyName = companyProfile?.companyName || 'Đang tải thông tin doanh nghiệp...';
                      const taxCode = companyProfile?.taxCode || 'Đang tải...';

                      return (
                        <tr key={item.id || index} className="hover:bg-gray-50/50 transition-colors h-14">
                          <td className="py-3 px-4 flex items-center justify-center gap-2 h-14 text-gray-500">
                            {item.reportPeriod?.status === 'CLOSED' ? (
                              <span className="text-[10px] text-red-500 font-bold italic invisible">Đã đóng</span>
                            ) : isWaiting ? (
                              <button
                                onClick={() => handleInitializeReport(item.reportPeriodId)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                              >
                                Khai báo
                              </button>
                            ) : (
                              <>
                                <button
                                  title="Xem báo cáo"
                                  onClick={() => router.push(`/dashboard/accidents-enterprise/view/${item.id}`)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                {isModifiable ? (
                                  <button 
                                    onClick={() => router.push(`/dashboard/accidents-enterprise/edit/${item.id}`)} 
                                    title="Chỉnh sửa số liệu" 
                                    className={`flex items-center gap-1 p-1.5 rounded-lg transition-all cursor-pointer ${
                                      item.status === 'REJECTED' 
                                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-[10px]' 
                                        : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    {item.status === 'REJECTED'}
                                  </button>
                                ) : <span className="w-7"></span>}
                                
                              </>
                            )}
                            
                          </td>

                          <td className="py-3 px-6 text-center font-semibold text-gray-800 text-xs">{companyName}</td>
                          <td className="py-3 px-6 text-center text-gray-600 font-mono text-xs">{taxCode}</td>
                          <td className="py-3 px-6 text-center text-gray-600 text-xs">{periodName}</td>
                          
                          <td className="py-3 px-6 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              {item.reportPeriod?.status === 'CLOSED' ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-gray-100 text-gray-500 border-gray-200 text-center">
                                  Đã đóng
                                </span>
                              ) : (
                                <>
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                    item.status === 'WAITING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                    item.status === 'DRAFT' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                    item.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                    item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    'bg-red-50 text-red-600 border-red-200'
                                  }`}>
                                    {isWaiting ? 'Chờ báo cáo' : 
                                    item.status === 'DRAFT' ? 'Đang báo cáo' : 
                                    item.status === 'SUBMITTED' ? 'Đã tiếp nhận' : 
                                    item.status === 'APPROVED' ? 'Đã duyệt' : 'Bị từ chối'}
                                  </span>

                                  {item.status === 'REJECTED' && item.note && (
                                    <button 
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setShowHistoryModal(true);
                                      }}
                                      className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-bold flex items-center gap-0.5 cursor-pointer transition-all"
                                      title="Xem chi tiết lý do từ chối"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Xem lý do
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 font-normal italic">
                        Không tìm thấy kỳ báo cáo hợp lệ.
                      </td>
                    </tr>
                  )}
                </tbody>
          </table>
          
        </div>
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span>Hiển thị</span>
                <select
                  className="px-2 py-1 border border-gray-200 rounded bg-white text-gray-700 font-medium cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span>dòng mỗi trang</span>
              </div>

              <div className="text-gray-500 font-medium">
                Hiển thị {displayReports.length} báo cáo
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors text-gray-700 bg-white shadow-sm font-semibold cursor-pointer"
                >
                  ❮ Trước
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors text-gray-700 bg-white shadow-sm font-semibold cursor-pointer"
                >
                  Sau ❯
                </button>
              </div>
            </div>  
      </div>
    </div>
    {showHistoryModal && selectedItem && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-sm text-gray-800">Chi tiết báo cáo bị từ chối</h3>
            <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="p-6 border-b border-gray-100 bg-white">
            <div className="space-y-2 text-xs">
              <p><span className="text-gray-500">Tên doanh nghiệp:</span> <span className="font-bold text-gray-800">{companyProfile?.companyName || "N/A"}</span></p>
              <p><span className="text-gray-500">Mã số thuế:</span> <span className="font-bold text-gray-800">{companyProfile?.taxCode || "N/A"}</span></p>
              <p><span className="text-gray-500">Kỳ báo cáo:</span> <span className="font-bold text-gray-800">{selectedItem.reportPeriod?.name || `Kỳ báo cáo #${selectedItem.reportPeriodId}`}</span></p>
            </div>
          </div>

          <div className="p-6 bg-red-50/50">
            <label className="text-[11px] font-bold text-red-600 uppercase tracking-wide block mb-2">Lý do bị từ chối:</label>
            <div className="p-4 bg-white border border-red-100 rounded-lg text-xs text-gray-700 min-h-[100px] max-h-[300px] overflow-y-auto break-words whitespace-pre-wrap shadow-sm">
              {selectedItem.note || "Không có lý do cụ thể."}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            <button onClick={() => setShowHistoryModal(false)} className="px-5 py-2 text-xs font-bold bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Đóng</button>
          </div>
        </div>
      </div>
    )}
  </div>
  
  );
};