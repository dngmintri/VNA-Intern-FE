'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/libs/core/api/axios';
import { AccidentReportSheet, RelationalReport, ReportStatistic } from './components/AccidentReportSheet';
import { AccidentSummaryReport } from './components/AccidentSummaryReport';
import { useHasPermission } from '@/libs/shared/hooks/useHasPermission';
import { useRouter } from 'next/navigation';

interface Province {
  id: number;
  name: string;
}

interface Ward {
  id: number;
  name: string;
}

interface ReportPeriod {
  id: number;
  name: string;
  year: number;
}

interface ReportItem extends RelationalReport {
  companyName: string;
  taxCode: string;
  period: string;
  year: number;
  province: string;
  ward: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}

interface RawReport {
  id: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  company?: {
    companyName?: string;
    taxCode?: string;
    provinceDkkd?: { name?: string } | null;
    wardDkkd?: { name?: string } | null;
  } | null;
  reportPeriod?: {
    name?: string;
    year?: number;
  } | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  statistics?: ReportStatistic[];
}

interface TimelineItem {
  time: string;
  title: string;
  reason?: string;
  type: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

const TIMELINE_CONFIG = {
  SUBMITTED: {
    dotColor: 'bg-blue-500',
    titleColor: 'text-blue-700',
    bgColor: 'bg-blue-50/50',
    borderColor: 'border-blue-100',
  },
  APPROVED: {
    dotColor: 'bg-emerald-500',
    titleColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50/50',
    borderColor: 'border-emerald-100',
  },
  REJECTED: {
    dotColor: 'bg-red-500',
    titleColor: 'text-red-700',
    bgColor: 'bg-red-50/50',
    borderColor: 'border-red-100',
  },
};

interface ReportMock {
  id: number;
  companyName: string;
  taxCode: string;
  period: '6 tháng' | 'Cả năm';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  year: number;
  province: string;
  ward: string;
  totalIncidents: number;
  totalFatalIncidents: number;
  totalMultipleVictimIncidents: number;
  totalVictims: number;
  totalFemaleVictims: number;
  totalFatalities: number;
  totalSeriouslyInjured: number;
  unmanagedVictims: number;
  unmanagedFemaleVictims: number;
  unmanagedFatalities: number;
  unmanagedSeriouslyInjured: number;
  medicalExpenses: number;
  treatmentSalaryExpenses: number;
  compensationExpenses: number;
  totalLeaveDays: number;
  propertyDamageExpenses: number;
  
  cause1: number;
  cause2: number;
  cause3: number;
  cause4: number;
  cause5: number;
  cause6: number;
  cause7: number;
  cause8: number;
  cause9: number;
  
  factor101: number;
  
  profession102: number;
  profession103: number;
  
  subsidizedIncidents: number;
  subsidizedFatalIncidents: number;
  subsidizedMultipleVictimIncidents: number;
  subsidizedVictims: number;
  subsidizedFemaleVictims: number;
  subsidizedFatalities: number;
  subsidizedSeriouslyInjured: number;
  subsidizedUnmanagedVictims: number;
  subsidizedUnmanagedFemaleVictims: number;
  subsidizedUnmanagedFatalities: number;
  subsidizedUnmanagedSeriouslyInjured: number;
}

const INITIAL_MOCK_REPORTS: ReportMock[] = [
  {
    id: 1,
    companyName: 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ VẬN TẢI PHẠM THIÊN ÂN',
    taxCode: '0317118106',
    period: '6 tháng',
    status: 'DRAFT',
    year: 2023,
    province: 'Hồ Chí Minh',
    ward: 'Phường Bến Nghé',
    totalIncidents: 2,
    totalFatalIncidents: 1,
    totalMultipleVictimIncidents: 1,
    totalVictims: 10,
    totalFemaleVictims: 5,
    totalFatalities: 5,
    totalSeriouslyInjured: 10,
    unmanagedVictims: 0,
    unmanagedFemaleVictims: 0,
    unmanagedFatalities: 0,
    unmanagedSeriouslyInjured: 0,
    medicalExpenses: 2000000,
    treatmentSalaryExpenses: 2000000,
    compensationExpenses: 2000000,
    totalLeaveDays: 20,
    propertyDamageExpenses: 20000000,
    cause1: 1,
    cause2: 0,
    cause3: 1,
    cause4: 0,
    cause5: 0,
    cause6: 0,
    cause7: 0,
    cause8: 0,
    cause9: 0,
    factor101: 2,
    profession102: 1,
    profession103: 1,
    subsidizedIncidents: 0,
    subsidizedFatalIncidents: 0,
    subsidizedMultipleVictimIncidents: 0,
    subsidizedVictims: 0,
    subsidizedFemaleVictims: 0,
    subsidizedFatalities: 0,
    subsidizedSeriouslyInjured: 0,
    subsidizedUnmanagedVictims: 0,
    subsidizedUnmanagedFemaleVictims: 0,
    subsidizedUnmanagedFatalities: 0,
    subsidizedUnmanagedSeriouslyInjured: 0,
  },
  {
    id: 2,
    companyName: 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ VẬN TẢI PHẠM THIÊN ÂN',
    taxCode: '0317118106',
    period: '6 tháng',
    status: 'SUBMITTED',
    year: 2023,
    province: 'Hồ Chí Minh',
    ward: 'Phường Bến Nghé',
    totalIncidents: 2,
    totalFatalIncidents: 1,
    totalMultipleVictimIncidents: 1,
    totalVictims: 10,
    totalFemaleVictims: 5,
    totalFatalities: 5,
    totalSeriouslyInjured: 10,
    unmanagedVictims: 0,
    unmanagedFemaleVictims: 0,
    unmanagedFatalities: 0,
    unmanagedSeriouslyInjured: 0,
    medicalExpenses: 2000000,
    treatmentSalaryExpenses: 2000000,
    compensationExpenses: 2000000,
    totalLeaveDays: 20,
    propertyDamageExpenses: 20000000,
    cause1: 1,
    cause2: 0,
    cause3: 1,
    cause4: 0,
    cause5: 0,
    cause6: 0,
    cause7: 0,
    cause8: 0,
    cause9: 0,
    factor101: 2,
    profession102: 1,
    profession103: 1,
    subsidizedIncidents: 0,
    subsidizedFatalIncidents: 0,
    subsidizedMultipleVictimIncidents: 0,
    subsidizedVictims: 0,
    subsidizedFemaleVictims: 0,
    subsidizedFatalities: 0,
    subsidizedSeriouslyInjured: 0,
    subsidizedUnmanagedVictims: 0,
    subsidizedUnmanagedFemaleVictims: 0,
    subsidizedUnmanagedFatalities: 0,
    subsidizedUnmanagedSeriouslyInjured: 0,
  },
  {
    id: 3,
    companyName: 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ VẬN TẢI PHẠM THIÊN',
    taxCode: '0317118107',
    period: 'Cả năm',
    status: 'SUBMITTED',
    year: 2023,
    province: 'Hồ Chí Minh',
    ward: 'Phường Đa Kao',
    totalIncidents: 1,
    totalFatalIncidents: 0,
    totalMultipleVictimIncidents: 0,
    totalVictims: 2,
    totalFemaleVictims: 1,
    totalFatalities: 0,
    totalSeriouslyInjured: 2,
    unmanagedVictims: 0,
    unmanagedFemaleVictims: 0,
    unmanagedFatalities: 0,
    unmanagedSeriouslyInjured: 0,
    medicalExpenses: 1500000,
    treatmentSalaryExpenses: 1000000,
    compensationExpenses: 2500000,
    totalLeaveDays: 14,
    propertyDamageExpenses: 5000000,
    cause1: 0,
    cause2: 0,
    cause3: 0,
    cause4: 0,
    cause5: 0,
    cause6: 0,
    cause7: 1,
    cause8: 0,
    cause9: 0,
    factor101: 1,
    profession102: 0,
    profession103: 1,
    subsidizedIncidents: 0,
    subsidizedFatalIncidents: 0,
    subsidizedMultipleVictimIncidents: 0,
    subsidizedVictims: 0,
    subsidizedFemaleVictims: 0,
    subsidizedFatalities: 0,
    subsidizedSeriouslyInjured: 0,
    subsidizedUnmanagedVictims: 0,
    subsidizedUnmanagedFemaleVictims: 0,
    subsidizedUnmanagedFatalities: 0,
    subsidizedUnmanagedSeriouslyInjured: 0,
  },
  {
    id: 4,
    companyName: 'CÔNG TY CỔ PHẦN CƠ KHÍ CHẾ TẠO SÀI GÒN',
    taxCode: '0317118108',
    period: '6 tháng',
    status: 'APPROVED',
    year: 2023,
    province: 'Hồ Chí Minh',
    ward: 'Phường Tân Định',
    totalIncidents: 1,
    totalFatalIncidents: 0,
    totalMultipleVictimIncidents: 0,
    totalVictims: 4,
    totalFemaleVictims: 2,
    totalFatalities: 0,
    totalSeriouslyInjured: 4,
    unmanagedVictims: 0,
    unmanagedFemaleVictims: 0,
    unmanagedFatalities: 0,
    unmanagedSeriouslyInjured: 0,
    medicalExpenses: 3000000,
    treatmentSalaryExpenses: 2500000,
    compensationExpenses: 4000000,
    totalLeaveDays: 24,
    propertyDamageExpenses: 12000000,
    cause1: 0,
    cause2: 0,
    cause3: 0,
    cause4: 1,
    cause5: 0,
    cause6: 0,
    cause7: 0,
    cause8: 0,
    cause9: 0,
    factor101: 1,
    profession102: 0,
    profession103: 1,
    subsidizedIncidents: 0,
    subsidizedFatalIncidents: 0,
    subsidizedMultipleVictimIncidents: 0,
    subsidizedVictims: 0,
    subsidizedFemaleVictims: 0,
    subsidizedFatalities: 0,
    subsidizedSeriouslyInjured: 0,
    subsidizedUnmanagedVictims: 0,
    subsidizedUnmanagedFemaleVictims: 0,
    subsidizedUnmanagedFatalities: 0,
    subsidizedUnmanagedSeriouslyInjured: 0,
  }
];

const formatVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatValueInThousands = (value: number) => {
  return new Intl.NumberFormat('de-DE').format(value);
};

export const AccidentAdmin = () => {
  const { hasPermission } = useHasPermission();
  const canApprove = hasPermission('APPROVE_REPORT');
  const canReject = hasPermission('REJECT_REPORT');
  const canView = hasPermission('VIEW_REPORT');
  const router = useRouter();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL' | 'SUMMARY'>('LIST');

  const [searchName, setSearchName] = useState<string>('');
  const [searchTaxCode, setSearchTaxCode] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [rejectTargetIds, setRejectTargetIds] = useState<number[]>([]);
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState<boolean>(false);
  const [approveConfirmTargetIds, setApproveConfirmTargetIds] = useState<number[]>([]);
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [reportTimeline, setReportTimeline] = useState<TimelineItem[]>([]);
  const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);
  const [timelineReportName, setTimelineReportName] = useState<string>('');

  const [availableYears, setAvailableYears] = useState<number[]>([2023, 2024, 2025, 2026]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  useEffect(() => {
    if (viewMode === 'LIST') {
      setSelectedReport(null);
      setReportTimeline([]);
    }
  }, [viewMode]);

  useEffect(() => {
    const loadConfigData = async () => {
      try {
        const periodRes = await api.get('/report-periods', { params: { limit: 100 } });
        const periodList = periodRes.data?.data?.data || [];
        if (periodList.length > 0) {
          const years: number[] = Array.from(new Set(periodList.map((p: ReportPeriod) => p.year)));
          years.sort((a, b) => b - a);
          setAvailableYears(years);
          const currentYear = new Date().getFullYear();
          if (years.includes(currentYear)) {
            setSelectedYear(currentYear);
          } else {
            setSelectedYear(years[0]);
          }
        }

        const provRes = await api.get('/location/provinces');
        const provList = provRes.data || [];
        setProvinces(provList);
        setSelectedProvince('');
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu cấu hình:', err);
      }
    };
    loadConfigData();
  }, []);

  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedProvince) {
        setWards([]);
        setSelectedWard('');
        return;
      }
      const matched = provinces.find((p: Province) => p.name === selectedProvince);
      if (!matched) {
        setWards([]);
        setSelectedWard('');
        return;
      }
      try {
        const res = await api.get(`/location/provinces/${matched.id}/wards`);
        setWards(res.data || []);
        setSelectedWard('');
      } catch (err) {
        console.error('Lỗi khi tải danh sách phường/xã:', err);
      }
    };
    fetchWards();
  }, [selectedProvince, provinces]);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await api.get('/report-periods', { params: { year: selectedYear, limit: 100 } });
        setPeriods(res.data?.data?.data || []);
      } catch (err) {
        console.error('Lỗi khi tải danh sách kỳ:', err);
      }
    };
    fetchPeriods();
  }, [selectedYear]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let reportPeriodId = undefined;
      if (selectedPeriod) {
        const matched = periods.find(p => p.name.toLowerCase().includes(selectedPeriod.toLowerCase()));
        if (matched) reportPeriodId = matched.id;
      }

      const params: Record<string, string | number | undefined> = {
        page: currentPage,
        limit: pageSize,
        companyName: searchName || undefined,
        taxCode: searchTaxCode || undefined,
        reportPeriodId,
        year: selectedYear,
        status: selectedStatus || undefined,
      };

      const response = await api.get('/so/reports', { params });
      if (response.data?.data) {
        const list = (response.data.data.data || []) as RawReport[];
        const mappedList: ReportItem[] = list.map((item: RawReport) => {
          const company = item.company;
          const reportPeriod = item.reportPeriod;
          return {
            id: item.id,
            status: item.status,
            companyName: company?.companyName || '—',
            taxCode: company?.taxCode || '—',
            period: reportPeriod?.name || '—',
            year: reportPeriod?.year || selectedYear,
            province: company?.provinceDkkd?.name || '—',
            ward: company?.wardDkkd?.name || '—',
            attachmentUrl: item.attachmentUrl,
            attachmentName: item.attachmentName,
            company: company ? {
              companyName: company.companyName || '—',
              taxCode: company.taxCode || '—',
              provinceDkkd: company.provinceDkkd ? { name: company.provinceDkkd.name || '—' } : null,
              wardDkkd: company.wardDkkd ? { name: company.wardDkkd.name || '—' } : null,
            } : null,
            reportPeriod: reportPeriod ? {
              name: reportPeriod.name || '—',
              year: reportPeriod.year || selectedYear,
            } : null,
            statistics: item.statistics,
          };
        });

        const filteredList = mappedList.filter((item: ReportItem) => {
          if (selectedProvince && item.province !== selectedProvince) return false;
          if (selectedWard && item.ward !== selectedWard) return false;
          return true;
        });

        setReports(filteredList);
        setTotalItems(filteredList.length);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách báo cáo:', err);
      toast.error('Không thể tải danh sách báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentPage, pageSize, searchName, searchTaxCode, selectedPeriod, selectedStatus, selectedYear, periods, selectedProvince, selectedWard]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchName, searchTaxCode, selectedPeriod, selectedStatus, selectedYear, selectedProvince, selectedWard]);

  const handleResetFilters = () => {
    setSearchName('');
    setSearchTaxCode('');
    setSelectedPeriod('');
    setSelectedStatus('');
    setSelectedProvince('');
    setSelectedWard('');
    toast.success('Đã xóa tất cả bộ lọc');
  };

  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  const handleBatchApproveClick = () => {
    if (selectedIds.length === 0) return;
    
    const nonSubmitted = reports.filter(r => selectedIds.includes(r.id) && r.status !== 'SUBMITTED');
    if (nonSubmitted.length > 0) {
      toast.error('Chỉ có thể duyệt báo cáo đang ở trạng thái Chờ duyệt (Đã tiếp nhận)!');
      return;
    }

    setApproveConfirmTargetIds(selectedIds);
    setShowApproveConfirmModal(true);
  };

  const handleConfirmApprove = async () => {
    try {
      await api.patch('/so/reports/approve', { reportIds: approveConfirmTargetIds.map(id => Number(id)) });
      toast.success(`Đã duyệt thành công ${approveConfirmTargetIds.length} báo cáo!`);
      setShowApproveConfirmModal(false);
      setApproveConfirmTargetIds([]);
      setSelectedIds([]);
      if (viewMode === 'DETAIL') {
        setViewMode('LIST');
      }
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error('Duyệt báo cáo thất bại');
    }
  };

  const getCompanyName = (reportId: number) => {
    const r = reports.find(item => item.id === reportId);
    return r?.companyName || selectedReport?.companyName || 'Báo cáo';
  };

  const handleBatchRejectClick = () => {
    if (selectedIds.length === 0) return;
    
    const nonSubmitted = reports.filter(r => selectedIds.includes(r.id) && r.status !== 'SUBMITTED');
    if (nonSubmitted.length > 0) {
      toast.error('Chỉ có thể từ chối báo cáo đang ở trạng thái Chờ duyệt (Đã tiếp nhận)!');
      return;
    }

    setRejectTargetIds(selectedIds);
    const initialReasons: Record<number, string> = {};
    selectedIds.forEach(id => {
      initialReasons[id] = '';
    });
    setRejectReasons(initialReasons);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    const emptyIds = rejectTargetIds.filter(id => !rejectReasons[id]?.trim());
    if (emptyIds.length > 0) {
      toast.error('Vui lòng nhập lý do từ chối cho tất cả báo cáo!');
      return;
    }

    try {
      await Promise.all(
        rejectTargetIds.map(id =>
          api.patch('/so/reports/reject', {
            reportIds: [Number(id)],
            note: rejectReasons[id].trim()
          })
        )
      );

      toast.success(`Đã từ chối ${rejectTargetIds.length} báo cáo.`);
      setShowRejectModal(false);
      setSelectedIds([]);
      setRejectTargetIds([]);
      setRejectReasons({});
      if (viewMode === 'DETAIL') {
        setViewMode('LIST');
      }
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error('Từ chối báo cáo thất bại');
    }
  };

  const handlePrint = async () => {
    if (!selectedReport?.id) return;
    try {
      const res = await api.get(`/reports/${selectedReport.id}/print`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url);
    } catch (err) {
      console.error(err);
      toast.error('In báo cáo thất bại');
    }
  };

  const handleOpenTimelineModal = async (report: { id: number; companyName?: string }) => {
    try {
      setTimelineReportName(report.companyName || 'Báo cáo');
      const statusRes = await api.get(`/so/reports/${report.id}/status`);
      const timeline = (statusRes.data?.data?.timeline || statusRes.data?.timeline || []) as TimelineItem[];
      setReportTimeline(timeline);
      setShowTimelineModal(true);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải lịch sử xử lý');
    }
  };

  const handleViewReport = async (report: ReportItem) => {
    try {
      const response = await api.get(`/so/reports/${report.id}`);
      const rawReport = response.data?.data || response.data;
      if (rawReport) {
        const mappedReport: ReportItem = {
          ...rawReport,
          companyName: rawReport.company?.companyName || '—',
          taxCode: rawReport.company?.taxCode || '—',
          period: rawReport.reportPeriod?.name || '—',
          status: rawReport.status,
          year: rawReport.reportPeriod?.year || selectedYear,
          province: rawReport.company?.provinceDkkd?.name || '—',
          ward: rawReport.company?.wardDkkd?.name || '—',
          attachmentUrl: rawReport.attachmentUrl || rawReport.attachment_url || null,
          attachmentName: rawReport.attachmentName || rawReport.attachment_name || null,
        };

        setSelectedReport(mappedReport);
        setViewMode('DETAIL');
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết báo cáo:', err);
      toast.error('Không thể tải chi tiết báo cáo');
    }
  };

  const summaryPeriodText = selectedPeriod ? selectedPeriod : 'Cả năm & 6 tháng';

  const handleOpenSummaryModal = () => {
    setViewMode('SUMMARY');
  };

  if (viewMode === 'SUMMARY') {
    const selectedProvinceObj = provinces.find((p: Province) => p.name === selectedProvince);
    return (
      <AccidentSummaryReport
        year={selectedYear}
        periodText={summaryPeriodText}
        provinceId={selectedProvinceObj?.id}
        onBack={() => setViewMode('LIST')}
      />
    );
  }

  if (viewMode === 'DETAIL' && selectedReport) {
    return (
      <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
        <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Tai nạn lao động</span>
            <span className="text-xs text-gray-400">❯</span>
            <span className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer" onClick={() => setViewMode('LIST')}>TNLĐ theo HĐLĐ</span>
            <span className="text-xs text-gray-400">❯</span>
            <h1 className="text-sm font-bold text-gray-800">Chi tiết báo cáo</h1>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 bg-white cursor-pointer"
            >
              In báo cáo
            </button>
            {selectedReport.status === 'SUBMITTED' && (
              <>
                {canReject && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTargetIds([selectedReport.id]);
                      setRejectReasons({ [selectedReport.id]: '' });
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Từ chối duyệt
                  </button>
                )}
                {canApprove && (
                  <button
                    type="button"
                    onClick={() => {
                      setApproveConfirmTargetIds([selectedReport.id]);
                      setShowApproveConfirmModal(true);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Duyệt báo cáo
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 max-w-[1400px] w-full mx-auto select-text">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
            
            <div className="text-center space-y-1 pb-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">BÁO CÁO TỔNG HỢP TÌNH HÌNH TAI NẠN LAO ĐỘNG</h2>
              <p className="text-xs text-gray-500 font-medium">Kỳ báo cáo: {selectedReport.period} - Năm {selectedReport.year}</p>
              
              <div className="text-left bg-gray-50/50 rounded-xl p-4 border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-4 text-xs">
                <div>
                  <span className="text-gray-400">Tên doanh nghiệp:</span>
                  <span className="font-bold text-gray-800 block mt-0.5">{selectedReport.companyName}</span>
                </div>
                <div>
                  <span className="text-gray-400">Mã số thuế:</span>
                  <span className="font-bold text-gray-800 block font-mono mt-0.5">{selectedReport.taxCode}</span>
                </div>
                <div>
                  <span className="text-gray-400">Vị trí địa lý:</span>
                  <span className="font-medium text-gray-700 block mt-0.5">{selectedReport.ward}, {selectedReport.province}</span>
                </div>
                <div>
                  <span className="text-gray-400">Trạng thái hồ sơ:</span>
                  <div className="mt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedReport.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : selectedReport.status === 'SUBMITTED'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : selectedReport.status === 'REJECTED'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}>
                      {selectedReport.status === 'APPROVED' ? 'Đã duyệt' : selectedReport.status === 'SUBMITTED' ? 'Đã tiếp nhận (Chờ duyệt)' : selectedReport.status === 'REJECTED' ? 'Bị từ chối' : 'Đang báo cáo (Draft)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedReport.attachmentUrl ? (
              <div className="flex items-center justify-between border border-dashed border-blue-200 rounded-lg p-3 bg-blue-50/40 text-xs">
                <span className="font-medium text-blue-800">
                  ** File đính kèm báo cáo TNLĐ có dấu mộc công ty:
                </span>
                <a 
                  href={`http://localhost:8080${selectedReport.attachmentUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                  {selectedReport.attachmentName || 'baocaoTNLD.pdf'}
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-between border border-dashed border-gray-200 rounded-lg p-3 bg-gray-50 text-xs text-gray-400">
                <span className="font-medium">
                  ** File đính kèm báo cáo TNLĐ có dấu mộc công ty:
                </span>
                <span>Chưa có file đính kèm</span>
              </div>
            )}
            <AccidentReportSheet report={selectedReport} />

          </div>
        </div>

        {showRejectModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 select-none animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden border border-gray-150 font-sans text-gray-700">
              <div className="bg-red-600 text-white font-bold text-sm uppercase py-4 px-6 text-center tracking-wider">
                Lý do từ chối báo cáo
              </div>
              
              <div className="p-6 space-y-4 text-xs">
                <label className="block text-xs font-bold text-gray-400 uppercase">
                  Lý do từ chối nộp báo cáo:
                </label>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {rejectTargetIds.map((id) => (
                    <div key={id} className="space-y-1.5 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="font-bold text-gray-700 text-[11px] uppercase tracking-wide">
                        {getCompanyName(id)}
                      </div>
                      <textarea
                        value={rejectReasons[id] || ''}
                        onChange={(e) => {
                          setRejectReasons(prev => ({
                            ...prev,
                            [id]: e.target.value
                          }));
                        }}
                        placeholder="Nhập lý do từ chối..."
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-gray-50 focus:outline-none focus:border-red-500 h-20 leading-relaxed font-normal text-gray-800 placeholder-gray-400"
                      />
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 leading-relaxed font-medium">
                  **Lưu ý:** Hành động từ chối báo cáo này không thể hoàn tác sau khi xác nhận. Lý do từ chối sẽ được gửi trực tiếp cho doanh nghiệp để họ điều chỉnh và nộp lại báo cáo.
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectTargetIds([]);
                  }}
                  className="px-4 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        )}

        {showApproveConfirmModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 select-none animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden border border-gray-150 font-sans text-gray-700">
              <div className="bg-emerald-600 text-white font-bold text-sm uppercase py-4 px-6 text-center tracking-wider">
                Xác nhận duyệt báo cáo
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-center">
                  <div className="bg-emerald-100 text-emerald-600 rounded-full p-3.5">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 text-center font-medium leading-relaxed">
                  Bạn có chắc chắn muốn phê duyệt {approveConfirmTargetIds.length} báo cáo đã chọn?
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed font-medium">
                  **Lưu ý:** Hành động này sẽ thay đổi trạng thái của báo cáo sang "Đã duyệt" và không thể hoàn tác sau khi xác nhận.
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveConfirmModal(false);
                    setApproveConfirmTargetIds([]);
                  }}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Đồng ý duyệt
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Tai nạn lao động</span>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-800">TNLĐ theo HĐLĐ</h1>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold">Năm:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer w-24"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
          
          <button
            type="button"
            onClick={handleOpenSummaryModal}
            className="px-4 py-1.5 border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold shadow-sm transition-colors bg-white cursor-pointer"
          >
            Báo cáo tổng hợp
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col justify-start">
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tỉnh/ thành phố</label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
            >
              <option value="">Chọn tỉnh/ thành phố</option>
              {provinces.map((prov: Province) => (
                <option key={prov.id} value={prov.name}>{prov.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Phường/ Xã</label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
            >
              <option value="">Tất cả phường/ xã</option>
              {wards.map((w: Ward) => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-normal text-[10px]">
                  {(canApprove || canReject) && (
                    <th className="py-3 px-2 text-center w-10">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={reports.length > 0 && reports.every((r: ReportItem) => selectedIds.includes(r.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(reports.map((r: ReportItem) => r.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                          className="w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                        />
                      </div>
                    </th>
                  )}
                  <th className="py-3 px-2 w-20 text-center">Thao tác</th>
                  <th className="py-3 px-3 w-[450px]">Tên doanh nghiệp</th>
                  <th className="py-3 px-3 w-40">Mã số thuế</th>
                  <th className="py-3 px-3 w-36">Kỳ báo cáo</th>
                  <th className="py-3 px-3 w-32 text-center">Trạng thái</th>
                </tr>
                
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {(canApprove || canReject) && <th className="py-2 px-2"></th>}
                  <th className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={handleResetFilters}
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
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="Tìm tên doanh nghiệp..."
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>
                  <th className="py-2 px-3">
                    <input
                      type="text"
                      value={searchTaxCode}
                      onChange={(e) => setSearchTaxCode(e.target.value)}
                      placeholder="Tìm MST..."
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>
                  <th className="py-2 px-3">
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Kỳ báo cáo</option>
                      <option value="6 tháng">6 tháng</option>
                      <option value="Cả năm">Cả năm</option>
                    </select>
                  </th>
                  <th className="py-2 px-3">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Trạng thái</option>
                      <option value="DRAFT">Đang báo cáo</option>
                      <option value="SUBMITTED">Đã tiếp nhận</option>
                      <option value="APPROVED">Đã duyệt</option>
                      <option value="REJECTED">Bị từ chối</option>
                    </select>
                  </th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={canApprove || canReject ? 6 : 5} className="py-8 text-center text-gray-400 font-medium bg-white">
                      Không tìm thấy báo cáo nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                      {(canApprove || canReject) && (
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(report.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds((prev) => [...prev, report.id]);
                                } else {
                                  setSelectedIds((prev) => prev.filter((id) => id !== report.id));
                                }
                              }}
                              className="w-3.5 h-3.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                            />
                          </div>
                        </td>
                      )}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canView && (
                            <button
                              type="button"
                              onClick={() => router.push(`/dashboard/accidents-admin/view/${report.id}`)}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-center"
                              title="Xem chi tiết báo cáo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          {canView && (
                            <button
                              type="button"
                              onClick={() => handleOpenTimelineModal(report)}
                              className="text-gray-400 hover:text-amber-600 transition-colors p-1 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-center"
                              title="Lịch sử xử lý"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800 leading-relaxed max-w-sm truncate" title={report.companyName}>
                        {report.companyName}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800 tracking-wider font-mono">
                        {report.taxCode}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {report.period} (Năm {report.year})
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            report.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : report.status === 'SUBMITTED'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : report.status === 'REJECTED'
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                          }`}>
                            {report.status === 'APPROVED' ? 'Đã duyệt' : report.status === 'SUBMITTED' ? 'Đã tiếp nhận' : report.status === 'REJECTED' ? 'Từ chối' : 'Đang báo cáo'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>dòng mỗi trang</span>
            </div>

            <div className="text-gray-500 font-medium">
              Hiển thị {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} của {totalItems} báo cáo
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
              <button
                type="button"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 bg-white shadow-sm font-semibold cursor-pointer"
              >
                Sau ❯
              </button>
            </div>
          </div>
          
        </div>
      </div>
      
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-150 flex items-center h-12 overflow-hidden z-50 animate-fadeIn pr-4 font-sans select-none">
          <div className="bg-[#2F6BFF] text-white w-12 h-full flex items-center justify-center font-bold text-sm">
            {selectedIds.length}
          </div>
          <div className="px-4 text-gray-800 font-medium text-xs whitespace-nowrap">
            báo cáo được chọn
          </div>
          
          {canApprove && (
            <button
              type="button"
              onClick={handleBatchApproveClick}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-8 px-3.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-2 shadow-sm"
            >
              Duyệt báo cáo
            </button>
          )}
          
          {canReject && (
            <button
              type="button"
              onClick={handleBatchRejectClick}
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg h-8 px-3.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-3 shadow-sm"
            >
              Từ chối
            </button>
          )}

          <div className="w-px h-6 bg-gray-200 mr-3" />

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-center"
            title="Bỏ chọn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}



      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 select-none animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden border border-gray-150 font-sans text-gray-700">
            <div className="bg-red-600 text-white font-bold text-sm uppercase py-4 px-6 text-center tracking-wider">
              Lý do từ chối báo cáo
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <label className="block text-xs font-bold text-gray-400 uppercase">
                Lý do từ chối nộp báo cáo:
              </label>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {rejectTargetIds.map((id) => (
                  <div key={id} className="space-y-1.5 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="font-bold text-gray-700 text-[11px] uppercase tracking-wide">
                      {getCompanyName(id)}
                    </div>
                    <textarea
                      value={rejectReasons[id] || ''}
                      onChange={(e) => {
                        setRejectReasons(prev => ({
                          ...prev,
                          [id]: e.target.value
                        }));
                      }}
                      placeholder="Nhập lý do từ chối..."
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-gray-50 focus:outline-none focus:border-red-500 h-20 leading-relaxed font-normal text-gray-800 placeholder-gray-400"
                    />
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 leading-relaxed font-medium">
                **Lưu ý:** Hành động từ chối báo cáo này không thể hoàn tác sau khi xác nhận. Lý do từ chối sẽ được gửi trực tiếp cho doanh nghiệp để họ điều chỉnh và nộp lại báo cáo.
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectTargetIds([]);
                }}
                className="px-4 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 select-none animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden border border-gray-150 font-sans text-gray-700">
            <div className="bg-emerald-600 text-white font-bold text-sm uppercase py-4 px-6 text-center tracking-wider">
              Xác nhận duyệt báo cáo
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-center">
                <div className="bg-emerald-100 text-emerald-600 rounded-full p-3.5">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 text-center font-medium leading-relaxed">
                Bạn có chắc chắn muốn phê duyệt {approveConfirmTargetIds.length} báo cáo đã chọn?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed font-medium">
                **Lưu ý:** Hành động này sẽ thay đổi trạng thái của báo cáo sang "Đã duyệt" và không thể hoàn tác sau khi xác nhận.
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowApproveConfirmModal(false);
                  setApproveConfirmTargetIds([]);
                }}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Đồng ý duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {showTimelineModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 select-none animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden border border-gray-150 font-sans text-gray-700">
            <div className="bg-blue-600 text-white font-bold text-sm uppercase py-4 px-6 text-center tracking-wider flex items-center justify-center gap-2 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Lịch sử xử lý báo cáo
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 bg-gray-50/50 -mx-6 -mt-6 p-6 mb-2">
                <div className="space-y-0.5">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Doanh nghiệp</span>
                  <span className="font-bold text-gray-800 text-xs block leading-tight">{timelineReportName}</span>
                </div>
                <div className="text-right space-y-0.5 shrink-0 pl-4 border-l border-gray-200">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Chuyên mục</span>
                  <span className="font-bold text-blue-600 text-xs block leading-tight">Tiến độ xử lý</span>
                </div>
              </div>

              {reportTimeline.length > 0 ? (
                <div className="relative max-h-[320px] overflow-y-auto pr-1">
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200" />
                  
                  <div className="space-y-5">
                    {reportTimeline.map((item, index) => {
                      const config = TIMELINE_CONFIG[item.type] || TIMELINE_CONFIG.SUBMITTED;
                      return (
                        <div key={index} className="relative pl-7 text-xs">
                          <div className={`absolute left-[5px] top-0.5 w-2.5 h-2.5 rounded-full ${config.dotColor} border-2 border-white shadow-xs`} />
                          
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                            <span className={`font-bold ${config.titleColor} leading-tight text-[11px]`}>{item.title}</span>
                            <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap pt-0.5">
                              {new Date(item.time).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          {item.reason && (
                            <div className={`mt-1.5 p-2.5 rounded-xl border text-[11px] leading-relaxed text-gray-600 ${config.bgColor} ${config.borderColor}`}>
                              <strong>Chi tiết:</strong> {item.reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs font-medium">
                  Chưa có lịch sử thao tác nào cho báo cáo này.
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowTimelineModal(false);
                  setReportTimeline([]);
                  setTimelineReportName('');
                }}
                className="px-5 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
