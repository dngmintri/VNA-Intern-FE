'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface Option {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Chọn...',
  size = 'sm',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const py = size === 'sm' ? 'py-1' : 'py-2';
  const textClass = size === 'sm' ? 'text-[11px]' : 'text-sm';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full px-2 ${py} border border-gray-200 rounded ${textClass} font-normal text-gray-700 bg-white cursor-pointer flex items-center justify-between transition-colors hover:border-gray-400 focus:outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
        }`}
      >
        <span
          className={`truncate ${
            selectedOption ? 'text-gray-800' : 'text-gray-400'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden max-h-60 flex flex-col">
          <div className="p-1.5 border-b border-gray-100 bg-gray-50">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="overflow-y-auto flex-1 max-h-48">
            <div
              onClick={() => handleSelect('')}
              className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-100 text-gray-500 ${
                !value ? 'bg-blue-50 font-medium text-blue-600' : ''
              }`}
            >
              -- Tất cả --
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 truncate ${
                    opt.value === value
                      ? 'bg-blue-50 font-medium text-blue-600'
                      : 'text-gray-700'
                  }`}
                  title={opt.label}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-gray-400 text-center">
                Không tìm thấy dữ liệu
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

