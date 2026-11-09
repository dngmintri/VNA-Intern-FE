'use client';

import React, { useEffect } from 'react';

export type PreviewFileType = 'pdf' | 'image' | 'word' | 'excel' | 'other';

export interface FileMeta {
  type: PreviewFileType;
  typeLabel: string;
  buttonLabel: string;
  cleanName: string;
  extension: string;
}

export const getFileMeta = (fileUrl?: string | null, fileName?: string | null): FileMeta => {
  const name =
    fileName ||
    (fileUrl ? fileUrl.split('/').pop()?.split('?')[0] : '') ||
    'Tài liệu đính kèm';
  const ext = (
    name.includes('.')
      ? '.' + name.split('.').pop()
      : fileUrl?.includes('.')
      ? '.' + fileUrl.split('.').pop()?.split('?')[0]
      : ''
  ).toLowerCase();

  if (ext === '.pdf') {
    return {
      type: 'pdf',
      typeLabel: 'Tài liệu PDF',
      buttonLabel: 'Xem file PDF',
      cleanName: name,
      extension: ext,
    };
  }

  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
    return {
      type: 'image',
      typeLabel: 'File hình ảnh',
      buttonLabel: 'Xem hình ảnh',
      cleanName: name,
      extension: ext,
    };
  }

  if (['.doc', '.docx'].includes(ext)) {
    return {
      type: 'word',
      typeLabel: 'Tài liệu Microsoft Word',
      buttonLabel: 'Xem file Word',
      cleanName: name,
      extension: ext,
    };
  }

  if (['.xls', '.xlsx'].includes(ext)) {
    return {
      type: 'excel',
      typeLabel: 'Bảng tính Excel',
      buttonLabel: 'Xem file Excel',
      cleanName: name,
      extension: ext,
    };
  }

  return {
    type: 'other',
    typeLabel: 'Tệp đính kèm',
    buttonLabel: 'Xem file đính kèm',
    cleanName: name,
    extension: ext,
  };
};

interface FilePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string | null;
  title?: string;
}

export const FilePreviewDrawer: React.FC<FilePreviewDrawerProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  title,
}) => {
  // Đóng bằng phím Escape & khóa scroll body
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !fileUrl) return null;

  const meta = getFileMeta(fileUrl, fileName);
  const cleanName = meta.cleanName;
  const isLocalUrl = fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1');

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden">
      {/* Backdrop overlay mờ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-out"
        onClick={onClose}
      />

      {/* Panel Drawer trượt từ cạnh phải */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-white shadow-2xl flex flex-col h-full animate-slideInRight border-l border-gray-200">
          
          {/* Header */}
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0 pr-4">
              {/* Icon badge */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                  meta.type === 'pdf'
                    ? 'bg-red-100 text-red-600'
                    : meta.type === 'image'
                    ? 'bg-emerald-100 text-emerald-600'
                    : meta.type === 'word'
                    ? 'bg-blue-100 text-blue-600'
                    : meta.type === 'excel'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {meta.type === 'pdf' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2.5 7.5h-1v-4h1c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5zm-1-3v2h1c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1zm6 3h-2.5v-4H18v1h-1.5v.5H18v1h-1.5v1.5zm-8 0H6.5v-4H8c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5zm-1-3v2H8c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1z" />
                  </svg>
                ) : meta.type === 'image' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                ) : meta.type === 'word' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm4.8-3.5h-1.5l-1.8-6h1.4l1.1 4.2 1.2-4.2h1.4l1.2 4.2 1.1-4.2h1.4l-1.8 6h-1.5l-1.3-4.5-1.3 4.5z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate" title={cleanName}>
                  {title || cleanName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-gray-500">
                    {meta.typeLabel}
                  </span>
                  {meta.extension && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-gray-200 text-gray-700">
                      {meta.extension.replace('.', '')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mở tab mới */}
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 text-gray-600 hover:text-blue-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-xs"
                title="Mở toàn màn hình trong tab mới"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span className="hidden sm:inline">Mở tab mới</span>
              </a>

              {/* Tải về */}
              <a
                href={fileUrl}
                download={cleanName}
                className="px-2.5 py-1.5 text-gray-600 hover:text-blue-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-xs"
                title="Tải file về máy"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span className="hidden sm:inline">Tải về</span>
              </a>

              {/* Đóng */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer ml-1"
                title="Đóng Drawer (Esc)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body Viewer */}
          <div className="flex-1 bg-gray-100 overflow-hidden relative flex items-center justify-center">
            {meta.type === 'pdf' ? (
              <iframe
                src={fileUrl}
                className="w-full h-full border-none bg-white"
                title="Xem trước file PDF"
              />
            ) : meta.type === 'image' ? (
              <div className="w-full h-full p-4 flex items-center justify-center overflow-auto bg-gray-50/80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl}
                  alt={cleanName}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-md border border-gray-200 bg-white"
                />
              </div>
            ) : meta.type === 'word' ? (
              isLocalUrl ? (
                // Nếu chạy môi trường cục bộ localhost, Office Viewer không thể fetch URL nội bộ
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4 bg-white rounded-2xl shadow-sm border border-gray-200">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm4.8-3.5h-1.5l-1.8-6h1.4l1.1 4.2 1.2-4.2h1.4l1.2 4.2 1.1-4.2h1.4l-1.8 6h-1.5l-1.3-4.5-1.3 4.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 break-all">{cleanName}</h4>
                    <p className="text-xs text-gray-500 mt-1">Tài liệu Microsoft Word (.docx/.doc)</p>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Trình duyệt không hỗ trợ đọc trực tiếp định dạng Word nội bộ. Vui lòng tải về máy hoặc mở tab mới để xem chi tiết.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={fileUrl}
                      download={cleanName}
                      className="px-4 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Tải file về máy
                    </a>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Mở tab mới
                    </a>
                  </div>
                </div>
              ) : (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
                  className="w-full h-full border-none bg-white"
                  title="Xem trước file Word"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4 bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center shadow-xs">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800 break-all">{cleanName}</h4>
                  <p className="text-xs text-gray-500 mt-1">{meta.typeLabel}</p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={fileUrl}
                    download={cleanName}
                    className="px-4 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    Tải file về máy
                  </a>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Mở tab mới
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface FilePreviewTriggerButtonProps {
  fileUrl?: string | null;
  fileName?: string | null;
  onClick: () => void;
  className?: string;
}

export const FilePreviewTriggerButton: React.FC<FilePreviewTriggerButtonProps> = ({
  fileUrl,
  fileName,
  onClick,
  className = '',
}) => {
  if (!fileUrl) {
    return <span className="text-gray-400 italic font-normal ml-1">(Chưa có file đính kèm)</span>;
  }

  const meta = getFileMeta(fileUrl, fileName);

  const colorStyles =
    meta.type === 'pdf'
      ? 'bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border-red-200'
      : meta.type === 'image'
      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border-emerald-200'
      : meta.type === 'word'
      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border-blue-200'
      : meta.type === 'excel'
      ? 'bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border-green-200'
      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-800 border-gray-200';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-md font-semibold text-xs shadow-xs transition-all cursor-pointer group ${colorStyles} ${className}`}
      title={`Bấm để xem nhanh ${meta.typeLabel} trong bảng điều khiển`}
    >
      {meta.type === 'pdf' ? (
        <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2.5 7.5h-1v-4h1c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5zm-1-3v2h1c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1zm6 3h-2.5v-4H18v1h-1.5v.5H18v1h-1.5v1.5zm-8 0H6.5v-4H8c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5zm-1-3v2H8c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1z" />
        </svg>
      ) : meta.type === 'image' ? (
        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ) : meta.type === 'word' ? (
        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm4.8-3.5h-1.5l-1.8-6h1.4l1.1 4.2 1.2-4.2h1.4l1.2 4.2 1.1-4.2h1.4l-1.8 6h-1.5l-1.3-4.5-1.3 4.5z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )}

      <span>{meta.buttonLabel}</span>

      {/* Icon mở drawer */}
      <svg
        className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

export default FilePreviewDrawer;
