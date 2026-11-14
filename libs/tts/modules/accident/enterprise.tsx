'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { reportApi, ReportItem } from './services/report.api';

export const Enterprise: React.FC = () => {
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [years] = useState<number[]>([
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
  ]);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [rejectionModalItem, setRejectionModalItem] = useState<ReportItem | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Tải danh sách báo cáo của doanh nghiệp
  const fetchMyReports = async () => {
    setIsFetching(true);
    try {
      const res = await reportApi.getMyReports({
        year: Number(selectedYear),
        pageNumber,
        pageSize,
      });

      const resData = res.data?.data || res.data;
      if (resData) {
        const items = resData.items || (Array.isArray(resData) ? resData : []);
        setReports(items);
        setTotal(resData.count ?? resData.total ?? items.length);
        setTotalPages(resData.totalPages || Math.ceil((resData.count ?? items.length) / pageSize) || 1);
      } else {
        setReports([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách báo cáo:', error);
      toast.error('Không thể tải danh sách báo cáo của doanh nghiệp');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, [selectedYear, pageNumber, pageSize]);

  return (
    <div className="w-full flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      {/* Header thanh điều hướng */}
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Tai nạn lao động</span>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-800">Báo cáo TNLĐ doanh nghiệp</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Năm:</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPageNumber(1);
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-700 font-bold text-xs focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Nội dung danh sách */}
      <div className="p-6 space-y-4 flex-1 flex flex-col justify-start">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-normal text-[10px]">
                <th className="py-3.5 px-4 w-28 text-center">Thao tác</th>
                <th className="py-3.5 px-6 text-center min-w-[280px]">Doanh nghiệp</th>
                <th className="py-3.5 px-6 w-36 text-center">Mã số thuế</th>
                <th className="py-3.5 px-6 w-44 text-center">Kỳ báo cáo</th>
                <th className="py-3.5 px-6 w-36 text-center">Năm</th>
                <th className="py-3.5 px-6 w-44 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {isFetching ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 font-medium animate-pulse">
                    Đang tải danh sách báo cáo...
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((item) => {
                  const isNotReporting = item.status === 'not_reporting' || item.status === 'pending';
                  const isDraft = item.status === 'reporting';
                  const isReceived = item.status === 'received';
                  const isApproved = item.status === 'approved';
                  const isRejected = item.status === 'rejected';
                  const isExpired = item.status === 'expired';
                  const periodLabel = (item.period?.includes('6') || item.configName?.includes('6')) ? '6 tháng' : 'Cả năm';

                  return (
                    <tr key={item.id || item.configId || Math.random()} className="hover:bg-gray-50/60 transition-colors h-14">
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Xem chi tiết (khi đã có báo cáo) */}
                          {item.id ? (
                            <button
                              title="Xem chi tiết báo cáo"
                              onClick={() => router.push(`/dashboard/accidents-enterprise/view/${item.id}`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          ) : (
                            <span className="p-1.5 text-gray-200 cursor-not-allowed" title="Chưa có dữ liệu báo cáo">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </span>
                          )}

                          {/* Chỉnh sửa / Bắt đầu nhập (Khi chưa báo cáo, đang lập báo cáo hoặc bị từ chối; không cho sửa khi đã quá hạn) */}
                          {(isNotReporting || isDraft || isRejected) && !isExpired && (
                            <button
                              title={isNotReporting ? 'Bắt đầu lập báo cáo' : isRejected ? 'Chỉnh sửa lại số liệu (Bị từ chối)' : 'Chỉnh sửa số liệu'}
                              onClick={() => {
                                if (item.id) {
                                  router.push(`/dashboard/accidents-enterprise/edit/${item.id}`);
                                } else {
                                  router.push(
                                    `/dashboard/accidents-enterprise/edit/new?configId=${item.configId || ''}&year=${item.year}&period=${encodeURIComponent(item.period)}`
                                  );
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-6 text-center font-semibold text-gray-800 text-xs">
                        {item.business?.name || 'Doanh nghiệp'}
                      </td>
                      <td className="py-3 px-6 text-center text-gray-600 font-mono text-xs">
                        {item.business?.taxCode || '—'}
                      </td>
                      <td className="py-3 px-6 text-center text-gray-700 text-xs font-medium">
                        {periodLabel}
                      </td>
                      <td className="py-3 px-6 text-center text-gray-600 text-xs font-semibold">
                        {item.year}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span
                          onClick={() => {
                            if (isRejected) setRejectionModalItem(item);
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                            isExpired
                              ? 'bg-gray-100 text-gray-500 border-gray-300'
                              : isNotReporting
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : isDraft
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : isReceived
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : isRejected
                              ? 'bg-rose-50 text-rose-600 border-rose-200 cursor-pointer hover:bg-rose-100 transition-colors shadow-sm'
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                          title={
                            isExpired
                              ? 'Kỳ báo cáo đã kết thúc (quá hạn)'
                              : isRejected
                              ? 'Bấm để xem chi tiết lý do từ chối'
                              : undefined
                          }
                        >
                          {isRejected && (
                            <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                          )}
                          {isExpired
                            ? 'Quá hạn'
                            : isNotReporting
                            ? 'Chưa báo cáo'
                            : isDraft
                            ? 'Đang báo cáo'
                            : isReceived
                            ? 'Chờ duyệt'
                            : isApproved
                            ? 'Đã duyệt'
                            : isRejected
                            ? 'Từ chối'
                            : 'Đang báo cáo'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-gray-400 font-normal italic">
                    Chưa có báo cáo nào trong năm {selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* Phân trang */}
          <div className="mt-auto px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                className="px-2 py-1 border border-gray-200 rounded bg-white text-gray-700 font-medium cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>dòng mỗi trang</span>
            </div>

            <div className="text-gray-500 font-medium">
              Tổng cộng {total} báo cáo (Trang {pageNumber} / {totalPages})
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors text-gray-700 bg-white shadow-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ❮ Trước
              </button>
              <button
                type="button"
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors text-gray-700 bg-white shadow-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau ❯
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal hiển thị lý do từ chối */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scaleIn border border-gray-100">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Lý do từ chối báo cáo</h3>
                <p className="text-xs text-gray-500">
                  {rejectionModalItem.period === '6 months' || rejectionModalItem.period?.includes('6') ? '6 tháng' : 'Cả năm'} - Năm {rejectionModalItem.year}
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-lg p-4 mb-5 text-xs text-gray-700 leading-relaxed">
              <span className="font-bold text-rose-800 block mb-1">Ghi chú từ Sở Lao động:</span>
              <p className="text-gray-800 whitespace-pre-wrap">{rejectionModalItem.note || 'Báo cáo chưa hợp lệ, vui lòng kiểm tra và nộp lại.'}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectionModalItem(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              {rejectionModalItem.id && (
                <button
                  type="button"
                  onClick={() => {
                    const id = rejectionModalItem.id;
                    setRejectionModalItem(null);
                    router.push(`/dashboard/accidents-enterprise/edit/${id}`);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 cursor-pointer"
                >
                  Chỉnh sửa báo cáo ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
