'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

const categoryItemSchema = z.object({
  code: z.string().min(1, { message: 'Mã số không được để trống' }),
  name: z.string().min(1, { message: 'Tên không được để trống' }),
  parentId: z.string().optional(),
  status: z.string().optional(),
});

type CategoryItemFormInput = z.infer<typeof categoryItemSchema>;

interface CategoryItem {
  id: number | string;
  code: string;
  name: string;
  level?: string;
  parentId?: number | string | null;
  parent_id?: number | string | null;
  status?: boolean;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem: {
    id: number | string | null;
    code: string;
    name: string;
    level: string;
    parentId: number | null;
    status: boolean;
  }) => void;
  categoryType: 'injury-factor' | 'injury-type' | 'profession';
  editItem: CategoryItem | null;
  items: CategoryItem[];
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categoryType,
  editItem,
  items,
}) => {
  const isEdit = editItem !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryItemFormInput>({
    resolver: zodResolver(categoryItemSchema),
    defaultValues: {
      code: '',
      name: '',
      parentId: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (isEdit && editItem && isOpen) {
      reset({
        code: editItem.code || '',
        name: editItem.name || '',
        parentId: editItem.parentId ? String(editItem.parentId) : (editItem.parent_id ? String(editItem.parent_id) : ''),
        status: editItem.status !== undefined ? (editItem.status ? 'ACTIVE' : 'INACTIVE') : 'ACTIVE',
      });
    } else if (!isEdit && isOpen) {
      reset({
        code: '',
        name: '',
        parentId: '',
        status: 'ACTIVE',
      });
    }
  }, [isEdit, editItem, isOpen, reset]);

  if (!isOpen) return null;

  let titleText = '';
  let codeLabel = '';
  let nameLabel = '';
  let parentLabel = '';

  if (categoryType === 'injury-factor') {
    titleText = isEdit ? 'Chỉnh sửa yếu tố chấn thương' : 'Thêm mới yếu tố chấn thương';
    codeLabel = 'Mã yếu tố';
    nameLabel = 'Yếu tố gây chấn thương';
  } else if (categoryType === 'injury-type') {
    titleText = isEdit ? 'Chỉnh sửa loại chấn thương' : 'Thêm mới loại chấn thương';
    codeLabel = 'Mã số';
    nameLabel = 'Tên loại chấn thương';
    parentLabel = 'Nhóm chấn thương cha';
  } else if (categoryType === 'profession') {
    titleText = isEdit ? 'Thêm mới nghề nghiệp' : 'Thêm mới nghề nghiệp';
    if (isEdit) titleText = 'Chỉnh sửa nghề nghiệp';
    codeLabel = 'Mã ngành';
    nameLabel = 'Tên ngành';
    parentLabel = 'Nhóm ngành cha';
  }

  const parentOptions = items
    .filter((i) => {
      if (isEdit && editItem) {
        if (i.id === editItem.id) return false;
        if (i.parentId === editItem.id) return false;
      }
      if (categoryType === 'injury-type') return i.level !== 'Cấp 3';
      if (categoryType === 'profession') return i.level !== 'Cấp 4';
      return false;
    })
    .map((i) => ({
      value: String(i.id),
      label: `${i.code} - ${i.name} (${i.level})`,
    }));

  const onSubmit = (values: CategoryItemFormInput) => {
    if (categoryType === 'injury-type' && !values.parentId) {
      toast.error('Loại chấn thương bắt buộc phải chọn Nhóm chấn thương cha!');
      return;
    }
    let level = 'Cấp 1';
    if (values.parentId) {
      const parentItem = items.find((i) => String(i.id) === values.parentId);
      if (parentItem) {
        if (parentItem.level === 'Cấp 1') level = 'Cấp 2';
        else if (parentItem.level === 'Cấp 2') level = 'Cấp 3';
        else if (parentItem.level === 'Cấp 3') level = 'Cấp 4';
      }
    }

    onSuccess({
      id: editItem?.id || null,
      code: values.code,
      name: values.name,
      level: level,
      parentId: values.parentId ? Number(values.parentId) : null,
      status: values.status === 'ACTIVE',
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 select-none animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden text-gray-700 font-sans border border-gray-150">
        
        <div className="bg-[#2F6BFF] text-white text-center py-4 font-bold text-base uppercase tracking-wider relative">
          {titleText}
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
            title="Đóng"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-gray-400 select-none z-10">
              {codeLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('code')}
              placeholder="VD: 1222"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder-gray-300 font-medium"
            />
            {errors.code && (
              <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.code.message}</span>
            )}
          </div>

          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-gray-400 select-none z-10">
              {nameLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="VD: Khai thác đá tổ ong"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder-gray-300 font-medium"
            />
            {errors.name && (
              <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.name.message}</span>
            )}
          </div>

          {categoryType !== 'injury-factor' && (
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-gray-400 select-none z-10">
                {parentLabel}
              </label>
              <select
                {...register('parentId')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 bg-white font-medium"
              >
                <option value="">-- Chọn nhóm cha --</option>
                {parentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {categoryType === 'injury-factor' && (
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-gray-400 select-none z-10">
                Trạng thái hoạt động
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-900 bg-white font-medium"
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Lưu lại
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
