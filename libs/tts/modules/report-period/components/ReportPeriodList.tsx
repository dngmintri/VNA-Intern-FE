'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/libs/core/api/axios';
import { AxiosError } from 'axios';
import { ReportPeriodModal } from './ReportPeriodModal';
import { useHasPermission } from '@/libs/shared/hooks/useHasPermission';

interface ReportPeriod {
  id: number;
  name: string;
  year: number;
  quarter: number;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  status: 'OPEN' | 'CLOSED';
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
  return normalized;
};

export const ReportPeriodList = () => {
  const { hasPermission } = useHasPermission();
  const canCreate = hasPermission('CREATE_REPORT');
  const canUpdate = hasPermission('UPDATE_REPORT');

  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [filterYear, setFilterYear] = useState<string>('');
  const [filterReportName, setFilterReportName] = useState<string>('');
  const [filterPeriodType, setFilterPeriodType] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

  const parseName = (fullName: string) => {
    let guessedPeriodType = 'Cả năm';
    if (fullName.includes('6 tháng đầu năm')) guessedPeriodType = '6 tháng đầu năm';
    else if (fullName.includes('6 tháng cuối năm')) guessedPeriodType = '6 tháng cuối năm';
    else if (fullName.includes('Quý 1')) guessedPeriodType = 'Quý 1';
    else if (fullName.includes('Quý 2')) guessedPeriodType = 'Quý 2';
    else if (fullName.includes('Quý 3')) guessedPeriodType = 'Quý 3';
    else if (fullName.includes('Quý 4')) guessedPeriodType = 'Quý 4';

    const guessedReportName = fullName
      .replace(guessedPeriodType, '')
      .replace(/năm \d{4}/g, '')
      .trim();

    return {
      reportName: guessedReportName || 'Báo cáo tai nạn lao động',
      periodType: guessedPeriodType,
    };
  };

  const fetchPeriods = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page: currentPage,
        limit: pageSize,
      };

      if (filterYear) params.year = Number(filterYear);
      if (filterStatus) params.status = filterStatus;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      
      if (filterReportName || filterPeriodType) {
        params.name = `${filterReportName} ${filterPeriodType}`.trim();
      }

      const response = await api.get('/report-periods', { params });
      
      if (response.data?.data) {
        setPeriods(response.data.data.data || []);
        setTotalItems(response.data.data.meta?.total || 0);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Không thể tải danh sách cấu hình báo cáo';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, [
    currentPage,
    pageSize,
    filterYear,
    filterReportName,
    filterPeriodType,
    filterStartDate,
    filterEndDate,
    filterStatus,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterYear,
    filterReportName,
    filterPeriodType,
    filterStartDate,
    filterEndDate,
    filterStatus,
  ]);

  const handleOpenCreateModal = () => {
    setSelectedPeriodId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (id: number) => {
    setSelectedPeriodId(id);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (period: ReportPeriod) => {
    const newStatus = period.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await api.patch(`/report-periods/${period.id}/delete`, {
        status: newStatus,
      });
      toast.success(
        newStatus === 'OPEN' 
          ? 'Đã mở khóa kỳ báo cáo thành công!' 
          : 'Đã đóng khóa kỳ báo cáo thành công!'
      );
      fetchPeriods();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const msg = axiosError.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg[0] : (msg || 'Thay đổi trạng thái thất bại')
      );
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const colSpanCount = 6 + (canUpdate ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Hệ thống</span>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-800">Danh sách cấu hình báo cáo</h1>
        </div>
        
        <div className="flex items-center gap-2.5">
          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Thêm mới
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col justify-start">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-normal text-[10px]">
                  {canUpdate && <th className="py-3 px-2 w-24 text-center">Thao tác</th>}
                  <th className="py-3 px-3 w-28">Năm báo cáo</th>
                  <th className="py-3 px-3 w-72">Tên báo cáo</th>
                  <th className="py-3 px-3 w-36">Kỳ báo cáo</th>
                  <th className="py-3 px-3 w-40">Thời gian bắt đầu</th>
                  <th className="py-3 px-3 w-40">Thời gian kết thúc</th>
                  <th className="py-3 px-2 w-24 text-center">Trạng thái</th>
                </tr>

                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {canUpdate && (
                    <th className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterYear('');
                          setFilterReportName('');
                          setFilterPeriodType('');
                          setFilterStartDate('');
                          setFilterEndDate('');
                          setFilterStatus('');
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
                  )}

                  <th className="py-2 px-3">
                    <input
                      type="text"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      placeholder="Tìm năm..."
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-800 placeholder-gray-450 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>

                  <th className="py-2 px-3">
                    <select
                      value={filterReportName}
                      onChange={(e) => setFilterReportName(e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Tên báo cáo</option>
                      <option value="Báo cáo tai nạn lao động">Báo cáo tai nạn lao động</option>
                      <option value="Báo cáo định kỳ tình hình TNLĐ">Báo cáo định kỳ tình hình TNLĐ</option>
                    </select>
                  </th>

                  <th className="py-2 px-3">
                    <select
                      value={filterPeriodType}
                      onChange={(e) => setFilterPeriodType(e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Kỳ báo cáo</option>
                      <option value="Cả năm">Cả năm</option>
                      <option value="6 tháng đầu năm">6 tháng đầu năm</option>
                      <option value="6 tháng cuối năm">6 tháng cuối năm</option>
                      <option value="Quý 1">Quý 1</option>
                      <option value="Quý 2">Quý 2</option>
                      <option value="Quý 3">Quý 3</option>
                      <option value="Quý 4">Quý 4</option>
                    </select>
                  </th>

                  <th className="py-2 px-3">
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-800 placeholder-gray-450 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>

                  <th className="py-2 px-3">
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-800 placeholder-gray-450 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>

                  <th className="py-2 px-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-1.5 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Trạng thái</option>
                      <option value="OPEN">Hoạt động</option>
                      <option value="CLOSED">Khóa (Đóng)</option>
                    </select>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={colSpanCount} className="py-12 text-center text-gray-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        Đang tải danh sách kỳ báo cáo...
                      </div>
                    </td>
                  </tr>
                ) : periods.length === 0 ? (
                  <tr>
                    <td colSpan={colSpanCount} className="py-12 text-center text-gray-400 font-medium">
                      Không tìm thấy cấu hình báo cáo nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  periods.map((period) => {
                    const parsed = parseName(period.name);
                    return (
                      <tr key={period.id} className="hover:bg-gray-50/50 transition-colors">
                        {canUpdate && (
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(period.id)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title="Chỉnh sửa cấu hình"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        )}

                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {period.year}
                        </td>

                        <td className="py-2.5 px-3 font-medium text-gray-800 truncate max-w-[280px]" title={parsed.reportName}>
                          {parsed.reportName}
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-600">
                            {parsed.periodType}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-gray-500">
                          {formatDisplayDate(period.startDate)}
                        </td>

                        <td className="py-2.5 px-3 text-gray-500">
                          {formatDisplayDate(period.endDate)}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center">
                            {canUpdate ? (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(period)}
                                className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                                  period.status === 'OPEN' ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                                }`}
                                title="Thay đổi trạng thái kỳ báo cáo"
                              >
                                <span className="bg-white w-3 h-3 rounded-full shadow-md" />
                              </button>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                period.status === 'OPEN' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                  : 'bg-gray-50 text-gray-400 border-gray-200'
                              }`}>
                                {period.status === 'OPEN' ? 'Hoạt động' : 'Đóng'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
              Hiển thị {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} của {totalItems} kỳ báo cáo
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

      <ReportPeriodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPeriods}
        periodId={selectedPeriodId}
      />
    </div>
  );
};
