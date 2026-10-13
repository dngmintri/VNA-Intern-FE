'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/libs/core/api/axios';
import { AccidentReportSheet, RelationalReport } from '@/libs/tts/modules/accident/components/AccidentReportSheet';
import { useHasPermission } from '@/libs/shared/hooks/useHasPermission';

interface RawReportData {
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
  statistics?: RelationalReport['statistics'];
}

interface MappedReportItem extends RelationalReport {
  companyName: string;
  taxCode: string;
  period: string;
  year: number;
  province: string;
  ward: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}

export default function AdminReportViewPage() {
  const router = useRouter();
  const params = useParams();
  const { hasPermission } = useHasPermission();
  const canApprove = hasPermission('APPROVE_REPORT');
  const canReject = hasPermission('REJECT_REPORT');

  const [report, setReport] = useState<MappedReportItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState<boolean>(false);

  const idStr = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = idStr ? parseInt(idStr, 10) : NaN;

  const loadReportDetail = async () => {
    if (Number.isNaN(id)) {
      toast.error('ID báo cáo không hợp lệ');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<{ data: RawReportData }>(`/so/reports/${id}`);
      const rawReport = response.data?.data;
      
      if (rawReport) {
        const mappedReport: MappedReportItem = {
          id: rawReport.id,
          status: rawReport.status,
          companyName: rawReport.company?.companyName || '—',
          taxCode: rawReport.company?.taxCode || '—',
          period: rawReport.reportPeriod?.name || '—',
          year: rawReport.reportPeriod?.year || 2026,
          province: rawReport.company?.provinceDkkd?.name || '—',
          ward: rawReport.company?.wardDkkd?.name || '—',
          attachmentUrl: rawReport.attachmentUrl || rawReport.attachmentName || null,
          attachmentName: rawReport.attachmentName || null,
          statistics: rawReport.statistics,
        };
        setReport(mappedReport);
      } else {
        toast.error('Không tìm thấy báo cáo');
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết báo cáo:', err);
      toast.error('Không thể tải chi tiết báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportDetail();
  }, [id]);

  const handlePrint = async () => {
    if (Number.isNaN(id)) return;
    try {
      const res = await api.get(`/reports/${id}/print`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url);
    } catch (err) {
      console.error(err);
      toast.error('In báo cáo thất bại');
    }
  };

  const handleConfirmApprove = async () => {
    if (Number.isNaN(id)) return;
    try {
      await api.patch('/so/reports/approve', { reportIds: [id] });
      toast.success('Phê duyệt báo cáo thành công!');
      setShowApproveConfirmModal(false);
      setIsLoading(true);
      loadReportDetail();
    } catch (err) {
      console.error(err);
      toast.error('Phê duyệt báo cáo thất bại');
    }
  };

  const handleConfirmReject = async () => {
    if (Number.isNaN(id)) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối!');
      return;
    }

    try {
      await api.patch('/so/reports/reject', {
        reportIds: [id],
        note: rejectReason.trim()
      });

      toast.success('Đã từ chối báo cáo.');
      setShowRejectModal(false);
      setIsLoading(true);
      loadReportDetail();
    } catch (err) {
      console.error(err);
      toast.error('Từ chối báo cáo thất bại');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F4F6F9]">
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Sở</span>
          <span className="text-xs text-gray-400">❯</span>
          <span
            onClick={() => router.push('/dashboard/accidents-admin')}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            Tai nạn lao động
          </span>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-800">
            Chi tiết báo cáo {report?.companyName ? ` - ${report.companyName}` : ''}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/dashboard/accidents-admin')}
            className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
          >
            Quay lại
          </button>
          <button
            type="button"
            disabled={isLoading || !report}
            onClick={handlePrint}
            className="px-4 py-1.5 border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 bg-white cursor-pointer disabled:opacity-50"
          >
            In báo cáo
          </button>
          {report && report.status === 'SUBMITTED' && (
            <>
              {canReject && (
                <button
                  type="button"
                  onClick={() => {
                    setRejectReason('');
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

      <div className="p-6 overflow-y-auto space-y-4 max-w-[1400px] w-full mx-auto select-text flex-1">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400 font-semibold animate-pulse">
              Đang tải chi tiết báo cáo...
            </div>
          ) : report ? (
            <>
              <div className="text-center space-y-1 pb-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  BÁO CÁO TỔNG HỢP TÌNH HÌNH TAI NẠN LAO ĐỘNG
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Kỳ báo cáo: {report.period} - Năm {report.year}
                </p>

                <div className="text-left bg-gray-50/50 rounded-xl p-4 border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-4 text-xs">
                  <div>
                    <span className="text-gray-400">Tên doanh nghiệp:</span>
                    <span className="font-bold text-gray-800 block mt-0.5">{report.companyName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Mã số thuế:</span>
                    <span className="font-bold text-gray-800 block font-mono mt-0.5">{report.taxCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Vị trí địa lý:</span>
                    <span className="font-medium text-gray-700 block mt-0.5">{report.ward}, {report.province}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Trạng thái hồ sơ:</span>
                    <div className="mt-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        report.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : report.status === 'SUBMITTED'
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : report.status === 'REJECTED'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        {report.status === 'APPROVED'
                          ? 'Đã duyệt'
                          : report.status === 'SUBMITTED'
                          ? 'Đã tiếp nhận (Chờ duyệt)'
                          : report.status === 'REJECTED'
                          ? 'Bị từ chối'
                          : 'Đang báo cáo (Draft)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {report.attachmentUrl ? (
                <div className="flex items-center justify-between border border-dashed border-blue-200 rounded-lg p-3 bg-blue-50/40 text-xs">
                  <span className="font-medium text-blue-800">
                    * File đính kèm báo cáo TNLĐ có dấu mộc công ty:
                  </span>
                  <a
                    href={`http://localhost:8080${report.attachmentUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    {report.attachmentName || 'baocaoTNLD.pdf'}
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-between border border-dashed border-gray-200 rounded-lg p-3 bg-gray-50 text-xs text-gray-400">
                  <span className="font-medium">
                    * File đính kèm báo cáo TNLĐ có dấu mộc công ty:
                  </span>
                  <span>Chưa có file đính kèm</span>
                </div>
              )}

              <AccidentReportSheet report={report} />
            </>
          ) : (
            <div className="py-20 text-center text-red-500 font-semibold">
              Không tìm thấy dữ liệu báo cáo
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 select-none animate-fadeIn font-sans">
          <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden border border-gray-150">
            <div className="bg-red-600 text-white font-bold text-sm uppercase py-4 px-6 text-center tracking-wider">
              Yêu cầu bổ sung số liệu báo cáo
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Lý do từ chối - {report?.companyName || 'Báo cáo'}
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối hoặc yêu cầu chỉnh sửa..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-red-500 text-gray-800 font-medium"
                />
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
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
                Bạn có chắc chắn muốn phê duyệt báo cáo này?
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
