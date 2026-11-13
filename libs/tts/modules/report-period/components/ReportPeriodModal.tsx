'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { api } from '@/libs/core/api/axios';
import { AxiosError } from 'axios';
import { reportApi } from '@/libs/tts/modules/accident/services/report.api';
import { DatePickerInput } from '@/libs/shared/components/DatePickerInput';

const reportPeriodSchema = z.object({
  reportName: z.string().min(1, { message: 'Tên báo cáo không được để trống' }),
  year: z.number().int().min(1900, { message: 'Năm phải từ 1900 trở đi' }),
  periodType: z.string().min(1, { message: 'Kỳ báo cáo không được để trống' }),
  startDate: z.string().min(1, { message: 'Ngày bắt đầu không được để trống' }),
  endDate: z.string().min(1, { message: 'Ngày kết thúc không được để trống' }),
  dueDate: z.string().optional(),
  status: z.enum(['OPEN', 'CLOSED']),
}).refine((data) => {
  return new Date(data.startDate) <= new Date(data.endDate);
}, {
  message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
  path: ['startDate'],
});

type ReportPeriodFormInput = z.infer<typeof reportPeriodSchema>;

interface ReportPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  periodId: string | number | null;
}

export const ReportPeriodModal: React.FC<ReportPeriodModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  periodId,
}) => {
  const isEdit = periodId !== null;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReportPeriodFormInput>({
    resolver: zodResolver(reportPeriodSchema),
    defaultValues: {
      reportName: 'Báo cáo tai nạn lao động',
      year: new Date().getFullYear(),
      periodType: 'Cả năm',
      startDate: '',
      endDate: '',
      dueDate: '',
      status: 'OPEN',
    },
  });

  const watchYear = watch('year');
  const watchPeriodType = watch('periodType');

  useEffect(() => {
    if (!isEdit && watchYear && watchPeriodType) {
      if (watchPeriodType === 'Cả năm') {
        setValue('startDate', `${watchYear}-01-01`);
        setValue('endDate', `${watchYear}-12-31`);
        setValue('dueDate', `${watchYear + 1}-01-15`);
      } else if (watchPeriodType === '6 tháng đầu năm') {
        setValue('startDate', `${watchYear}-01-01`);
        setValue('endDate', `${watchYear}-06-30`);
        setValue('dueDate', `${watchYear}-07-15`);
      } else if (watchPeriodType === '6 tháng cuối năm') {
        setValue('startDate', `${watchYear}-07-01`);
        setValue('endDate', `${watchYear}-12-31`);
        setValue('dueDate', `${watchYear + 1}-01-15`);
      }
    }
  }, [watchYear, watchPeriodType, isEdit, setValue]);

  useEffect(() => {
    if (isEdit && periodId && isOpen) {
      const fetchDetails = async () => {
        try {
          const response = await reportApi.getReportConfigById(String(periodId));
          const data = response.data?.data || response.data;
          if (data) {
            let guessedReportName = 'Báo cáo tai nạn lao động';
            let guessedPeriodType = 'Cả năm';

            if (data.period === '6 months start year' || data.period === '6 months') {
              guessedPeriodType = '6 tháng đầu năm';
            } else if (data.period === '6 months end year') {
              guessedPeriodType = '6 tháng cuối năm';
            } else if (data.period === '12 months') {
              guessedPeriodType = 'Cả năm';
            }

            if (data.name) {
              if (data.name.includes('6 tháng đầu năm')) {
                guessedPeriodType = '6 tháng đầu năm';
              } else if (data.name.includes('6 tháng cuối năm')) {
                guessedPeriodType = '6 tháng cuối năm';
              } else if (data.name.includes('Cả năm')) {
                guessedPeriodType = 'Cả năm';
              }

              guessedReportName = data.name
                .replace(guessedPeriodType, '')
                .replace(/năm \d{4}/, '')
                .trim();
            }

            const rawStart = data.dateStart || data.startDate;
            const rawEnd = data.dateEnd || data.endDate;

            reset({
              reportName: guessedReportName || 'Báo cáo tai nạn lao động',
              year: data.year,
              periodType: guessedPeriodType,
              startDate: rawStart ? String(rawStart).split('T')[0] : '',
              endDate: rawEnd ? String(rawEnd).split('T')[0] : '',
              dueDate: data.dueDate ? String(data.dueDate).split('T')[0] : (rawEnd ? String(rawEnd).split('T')[0] : ''),
              status: (data.status === true || data.status === 'OPEN') ? 'OPEN' : 'CLOSED',
            });
          }
        } catch (error) {
          console.error('Lỗi khi tải chi tiết kỳ báo cáo:', error);
          toast.error('Không thể tải thông tin chi tiết kỳ báo cáo');
        }
      };

      fetchDetails();
    } else if (!isEdit && isOpen) {
      reset({
        reportName: 'Báo cáo tai nạn lao động',
        year: new Date().getFullYear(),
        periodType: 'Cả năm',
        startDate: '',
        endDate: '',
        dueDate: '',
        status: 'OPEN',
      });
    }
  }, [isEdit, periodId, isOpen, reset]);

  const formatDateForBackend = (dateStr: string) => {
    return dateStr;
  };

  const onSubmit = async (values: ReportPeriodFormInput) => {
    let periodEnum = '12 months';
    if (values.periodType === '6 tháng đầu năm') {
      periodEnum = '6 months start year';
    } else if (values.periodType === '6 tháng cuối năm') {
      periodEnum = '6 months end year';
    } else if (values.periodType === 'Cả năm') {
      periodEnum = '12 months';
    }

    const name = `${values.reportName} ${values.periodType} năm ${values.year}`;

    const payload = {
      name,
      year: Number(values.year),
      period: periodEnum as any,
      dateStart: formatDateForBackend(values.startDate),
      dateEnd: formatDateForBackend(values.endDate),
      status: values.status === 'OPEN',
    };

    try {
      if (isEdit) {
        await reportApi.updateReportConfig(String(periodId), payload);
        toast.success('Cập nhật cấu hình báo cáo thành công!');
      } else {
        await reportApi.createReportConfig(payload);
        toast.success('Thêm cấu hình báo cáo thành công!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const msg = axiosError.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg[0] : (msg || 'Đã có lỗi xảy ra khi lưu cấu hình')
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 select-none">
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-fadeIn text-gray-700 font-sans border border-gray-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150 bg-gray-50">
          <h2 className="text-base font-bold text-gray-800">
            {isEdit ? 'Chỉnh sửa cấu hình báo cáo' : 'Thêm mới cấu hình báo cáo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Đóng"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">
              Tên báo cáo <span className="text-red-500">*</span>
            </label>
            <select
              {...register('reportName')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800 bg-white"
            >
              <option value="Báo cáo tai nạn lao động">Báo cáo tai nạn lao động</option>
              <option value="Báo cáo định kỳ tình hình TNLĐ">Báo cáo định kỳ tình hình TNLĐ</option>
            </select>
            {errors.reportName && (
              <span className="text-[11px] text-red-500 font-medium">{errors.reportName.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Năm <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                placeholder="VD: 2026"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800"
              />
              {errors.year && (
                <span className="text-[11px] text-red-500 font-medium">{errors.year.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Kỳ báo cáo <span className="text-red-500">*</span>
              </label>
              <select
                {...register('periodType')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800 bg-white"
              >
                <option value="Cả năm">Cả năm</option>
                <option value="6 tháng đầu năm">6 tháng đầu năm</option>
                <option value="6 tháng cuối năm">6 tháng cuối năm</option>
              </select>
              {errors.periodType && (
                <span className="text-[11px] text-red-500 font-medium">{errors.periodType.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <DatePickerInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!errors.startDate}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800 bg-white"
                  />
                )}
              />
              {errors.startDate && (
                <span className="text-[11px] text-red-500 font-medium">{errors.startDate.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="endDate"
                render={({ field }) => (
                  <DatePickerInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!errors.endDate}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800 bg-white"
                  />
                )}
              />
              {errors.endDate && (
                <span className="text-[11px] text-red-500 font-medium">{errors.endDate.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Hạn chót nộp báo cáo <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="dueDate"
                render={({ field }) => (
                  <DatePickerInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!errors.dueDate}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800 bg-white"
                  />
                )}
              />
              {errors.dueDate && (
                <span className="text-[11px] text-red-500 font-medium">{errors.dueDate.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Trạng thái
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800 bg-white"
              >
                <option value="OPEN">Hoạt động (Mở)</option>
                <option value="CLOSED">Ngừng hoạt động (Đóng)</option>
              </select>
              {errors.status && (
                <span className="text-[11px] text-red-500 font-medium">{errors.status.message}</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 text-xs font-bold rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
