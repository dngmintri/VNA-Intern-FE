'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface DatePickerInputProps {
  value?: string | null;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  max?: string;
  min?: string;
  className?: string;
  hasError?: boolean;
  id?: string;
  name?: string;
}

// Chuyển từ YYYY-MM-DD (hoặc ISO string) sang DD/MM/YYYY để hiển thị
const toDDMMYYYY = (val?: string | null): string => {
  if (!val) return '';
  let str = String(val).trim();
  if (str.includes('T')) {
    str = str.split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }
  return str;
};

// Chuyển từ DD/MM/YYYY sang YYYY-MM-DD để lưu trữ và gửi Backend
const toYYYYMMDD = (val?: string | null): string => {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    // Kiểm tra tính hợp lệ cơ bản
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  return '';
};

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  max,
  min,
  className,
  hasError = false,
  id,
  name,
}) => {
  const [displayText, setDisplayText] = useState<string>(() => toDDMMYYYY(value));
  const nativePickerRef = useRef<HTMLInputElement>(null);

  // Đồng bộ displayText khi props value từ ngoài thay đổi
  useEffect(() => {
    setDisplayText(toDDMMYYYY(value));
  }, [value]);

  // Xử lý khi người dùng gõ tay (Auto-masking dd/mm/yyyy)
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, ''); // Chỉ giữ số
    if (raw.length > 8) raw = raw.slice(0, 8); // Tối đa 8 số (ddmmyyyy)

    let formatted = '';
    if (raw.length > 0) {
      formatted = raw.slice(0, 2);
    }
    if (raw.length >= 3) {
      formatted += '/' + raw.slice(2, 4);
    }
    if (raw.length >= 5) {
      formatted += '/' + raw.slice(4, 8);
    }

    setDisplayText(formatted);

    // Khi người dùng nhập đủ 10 ký tự (dd/mm/yyyy)
    if (formatted.length === 10) {
      const iso = toYYYYMMDD(formatted);
      if (iso) {
        onChange?.(iso);
      } else {
        onChange?.('');
      }
    } else if (formatted.length === 0) {
      onChange?.('');
    }
  };

  // Mở popup lịch native của trình duyệt
  const handleOpenPicker = () => {
    if (disabled || !nativePickerRef.current) return;
    try {
      const el = nativePickerRef.current as HTMLInputElement & { showPicker?: () => void };
      if (typeof el.showPicker === 'function') {
        el.showPicker();
      } else {
        el.focus();
      }
    } catch {
      try {
        nativePickerRef.current?.focus();
      } catch {
        // no-op
      }
    }
  };

  // Khi người dùng chọn ngày từ popup lịch
  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedIso = e.target.value; // YYYY-MM-DD
    if (selectedIso) {
      setDisplayText(toDDMMYYYY(selectedIso));
      onChange?.(selectedIso);
    } else {
      setDisplayText('');
      onChange?.('');
    }
  };

  const isoValue = toYYYYMMDD(displayText) || (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '');

  const defaultClasses = `w-full h-[42px] pl-3 pr-10 border rounded-lg text-sm text-gray-800 bg-white focus:outline-none transition-colors ${
    hasError
      ? 'border-red-500 focus:border-red-500 bg-red-50/20'
      : 'border-gray-300 focus:border-blue-500'
  } ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`;

  return (
    <div className="relative w-full">
      {/* Ô nhập dạng text hiển thị chuẩn dd/mm/yyyy */}
      <input
        type="text"
        id={id}
        name={name}
        value={displayText}
        onChange={handleTextChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={10}
        className={className ? `${className} ${hasError ? 'border-red-500' : ''}` : defaultClasses}
      />

      {/* Nút icon lịch mở popup native picker */}
      <button
        type="button"
        tabIndex={-1}
        onClick={handleOpenPicker}
        disabled={disabled}
        title="Mở lịch chọn ngày"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1 rounded transition-colors disabled:opacity-40 disabled:hover:text-gray-400 cursor-pointer"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Input type="date" ẩn hoàn toàn dùng để kích hoạt popup lịch */}
      <input
        ref={nativePickerRef}
        type="date"
        tabIndex={-1}
        value={isoValue}
        onChange={handleNativeDateChange}
        max={max}
        min={min}
        disabled={disabled}
        className="sr-only pointer-events-none absolute opacity-0 w-0 h-0"
        aria-hidden="true"
      />
    </div>
  );
};

export default DatePickerInput;
