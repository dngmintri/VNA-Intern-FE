'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/libs/core/api/axios';
import { AxiosError } from 'axios';
import { CategoryModal } from './CategoryModal';
import { useHasPermission } from '@/libs/shared/hooks/useHasPermission';

interface CategoryItem {
  id: number | string;
  code: string;
  name: string;
  level?: string;
  parentId?: number | string | null;
  parent_id?: number | string | null;
  status?: boolean;
}

interface CategoryTreeNode {
  id: number | string;
  code: string;
  name: string;
  level?: string;
  parentId?: number | string | null;
  parent_id?: number | string | null;
  status?: boolean;
  children?: CategoryTreeNode[];
}

export const CategoryManager = () => {
  const { hasPermission, roleCode } = useHasPermission();
  const canUpdate = true;
  const canCreate = true;

  const [activeCategory, setActiveCategory] = useState<'injury-factor' | 'injury-type' | 'profession'>('injury-factor');
  
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchCode, setSearchCode] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [searchLevel, setSearchLevel] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<CategoryItem | null>(null);

  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

  useEffect(() => {
    setSearchCode('');
    setSearchName('');
    setSearchLevel('');
    setSearchStatus('');
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeCategory]);

  const sortHierarchicalItems = (flatItems: CategoryItem[]): CategoryItem[] => {
    flatItems.forEach((item) => {
      if (item.level === 'Cấp 1') {
        item.parentId = null;
        return;
      }

      if (item.parentId === null || item.parentId === undefined) {
        let parentLevel = '';
        if (item.level === 'Cấp 2') parentLevel = 'Cấp 1';
        else if (item.level === 'Cấp 3') parentLevel = 'Cấp 2';
        else if (item.level === 'Cấp 4') parentLevel = 'Cấp 3';

        if (parentLevel) {
          const candidates = flatItems
            .filter((p) => p.level === parentLevel && item.code.startsWith(p.code))
            .sort((a, b) => b.code.length - a.code.length);

          if (candidates.length > 0) {
            item.parentId = candidates[0].id;
          }
        }
      }
    });

    const childrenMap = new Map<number | string, CategoryItem[]>();
    const roots: CategoryItem[] = [];

    flatItems.forEach((item) => {
      if (item.parentId === null || item.parentId === undefined) {
        roots.push(item);
      } else {
        const parentId = item.parentId;
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(item);
      }
    });

    const allIds = new Set(flatItems.map((item) => item.id));
    flatItems.forEach((item) => {
      if (item.parentId !== null && item.parentId !== undefined && !allIds.has(item.parentId)) {
        roots.push(item);
      }
    });

    const compareCodes = (a: CategoryItem, b: CategoryItem) => {
      const codeA = (a.code || '').trim();
      const codeB = (b.code || '').trim();
      
      const numA = codeA === '' ? NaN : Number(codeA);
      const numB = codeB === '' ? NaN : Number(codeB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    };

    roots.sort(compareCodes);

    const result: CategoryItem[] = [];
    const traverse = (node: CategoryItem) => {
      result.push(node);
      const children = childrenMap.get(node.id) || [];
      children.sort(compareCodes);
      children.forEach((child) => traverse(child));
    };

    roots.forEach((root) => traverse(root));
    return result;
  };

  const fetchCategoryData = async () => {
    setIsLoading(true);
    try {
      let endpoint = '';
      if (activeCategory === 'injury-factor') endpoint = '/category/injury-factor';
      else if (activeCategory === 'injury-type') endpoint = '/category/injury-type';
      else if (activeCategory === 'profession') endpoint = '/category/profession';

      const response = await api.get<CategoryTreeNode[]>(endpoint);
      let fetchedData: CategoryItem[] = response.data || [];

      if (activeCategory === 'injury-type') {
        fetchedData = flattenInjuryTypes(response.data || []);
      }

      let itemsWithId = fetchedData.map((item, idx) => ({
        ...item,
        id: item.id !== undefined && item.id !== null ? item.id : `${activeCategory}-${item.code || idx}`,
      }));

      itemsWithId = sortHierarchicalItems(itemsWithId);

      setItems(itemsWithId);
    } catch (error) {
      console.error('Lỗi tải dữ liệu danh mục:', error);
      toast.error('Không thể tải dữ liệu danh mục từ hệ thống');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
  }, [activeCategory]);

  const flattenInjuryTypes = (treeData: CategoryTreeNode[]): CategoryItem[] => {
    const result: CategoryItem[] = [];
    const traverse = (node: CategoryTreeNode) => {
      result.push({
        id: node.id,
        code: node.code,
        name: node.name,
        level: node.level || 'Cấp 1',
        parentId: node.parentId || node.parent_id || null,
        status: node.status !== undefined ? node.status : true,
      });
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: CategoryTreeNode) => traverse(child));
      }
    };
    treeData.forEach((node) => traverse(node));
    return result.sort((a, b) => a.code.localeCompare(b.code));
  };

  const filteredItems = items.filter((item) => {
    const codeMatch = item.code.toLowerCase().includes(searchCode.toLowerCase());
    const nameMatch = item.name.toLowerCase().includes(searchName.toLowerCase());
    
    let levelMatch = true;
    if (searchLevel && item.level) {
      levelMatch = item.level === searchLevel;
    }

    let statusMatch = true;
    if (searchStatus && item.status !== undefined) {
      const wantActive = searchStatus === 'ACTIVE';
      statusMatch = item.status === wantActive;
    }

    return codeMatch && nameMatch && levelMatch && statusMatch;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchCode, searchName, searchLevel, searchStatus]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, pageSize]);

  const handleOpenCreateModal = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CategoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleModalSuccess = async (savedData: {
    id: number | string | null;
    code: string;
    name: string;
    level: string;
    parentId: number | null;
    status: boolean;
  }) => {
    setIsLoading(true);
    try {
      const payload: Record<string, string | number | boolean | null> = {
        code: savedData.code,
        name: savedData.name,
      };

      if (activeCategory === 'injury-factor') {
        payload.status = savedData.status;
      } else {
        payload.parentId = savedData.parentId ? Number(savedData.parentId) : null;
      }

      if (selectedItem) {
        let endpoint = '';
        if (activeCategory === 'injury-factor') endpoint = `/category/injury-factor/${selectedItem.id}`;
        else if (activeCategory === 'injury-type') endpoint = `/category/injury-type/${selectedItem.id}`;
        else if (activeCategory === 'profession') endpoint = `/category/profession/${selectedItem.id}`;

        await api.patch(endpoint, payload);
        toast.success('Cập nhật danh mục thành công!');
      } else {
        let endpoint = '';
        if (activeCategory === 'injury-factor') endpoint = '/category/injury-factor';
        else if (activeCategory === 'injury-type') endpoint = '/category/injury-type';
        else if (activeCategory === 'profession') endpoint = '/category/profession';

        await api.post(endpoint, payload);
        toast.success('Thêm mới danh mục thành công!');
      }
      await fetchCategoryData();
    } catch (error: unknown) {
      console.error('Lỗi khi lưu danh mục:', error);
      let errorMsg = 'Không thể lưu danh mục vào hệ thống';
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      if (axiosError?.response?.data?.message) {
        const message = axiosError.response.data.message;
        errorMsg = Array.isArray(message) ? message.join(', ') : String(message);
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (item: CategoryItem) => {
    setIsLoading(true);
    try {
      let endpoint = '';
      if (activeCategory === 'injury-factor') endpoint = `/category/injury-factor/${item.id}/toggle-status`;
      else if (activeCategory === 'injury-type') endpoint = `/category/injury-type/${item.id}/toggle-status`;
      else if (activeCategory === 'profession') endpoint = `/category/profession/${item.id}/toggle-status`;

      await api.patch(endpoint);
      toast.success('Đã thay đổi trạng thái thành công!');
      await fetchCategoryData();
    } catch (error: unknown) {
      console.error('Lỗi thay đổi trạng thái:', error);
      const axiosError = error as AxiosError<{ message?: string }>;
      const msg = axiosError?.response?.data?.message || 'Không thể thay đổi trạng thái danh mục';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchToggleStatus = async () => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          let endpoint = '';
          if (activeCategory === 'injury-factor') endpoint = `/category/injury-factor/${id}/toggle-status`;
          else if (activeCategory === 'injury-type') endpoint = `/category/injury-type/${id}/toggle-status`;
          else if (activeCategory === 'profession') endpoint = `/category/profession/${id}/toggle-status`;

          await api.patch(endpoint);
        })
      );
      toast.success(`Đã thay đổi trạng thái hoạt động của ${selectedIds.length} danh mục thành công!`);
      setSelectedIds([]);
      await fetchCategoryData();
    } catch (error: unknown) {
      console.error('Lỗi khi thay đổi trạng thái hàng loạt:', error);
      toast.error('Có lỗi xảy ra khi thay đổi trạng thái hàng loạt.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryName = (item: CategoryItem) => {
    if (!item.level || item.level === 'Cấp 1') {
      return <span className="font-semibold text-gray-900">{item.name}</span>;
    }

    let paddingClass = 'pl-4';
    if (item.level === 'Cấp 3') paddingClass = 'pl-8';
    if (item.level === 'Cấp 4') paddingClass = 'pl-12';

    return (
      <div className={`flex items-center ${paddingClass}`}>
        <span className="text-gray-300 font-mono select-none mr-2">└─</span>
        <span className="text-gray-700 font-medium truncate">{item.name}</span>
      </div>
    );
  };

  const renderLevelBadge = (level?: string) => {
    if (!level) return null;
    switch (level) {
      case 'Cấp 1':
        return (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-[10px] font-bold">
            Cấp 1
          </span>
        );
      case 'Cấp 2':
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-[10px] font-bold">
            Cấp 2
          </span>
        );
      case 'Cấp 3':
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[10px] font-bold">
            Cấp 3
          </span>
        );
      case 'Cấp 4':
        return (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-200 rounded text-[10px] font-bold">
            Cấp 4
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded text-[10px] font-bold">
            {level}
          </span>
        );
    }
  };


  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Hệ thống</span>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-800">Khai báo danh mục</h1>
        </div>
        
        <div className="flex items-center gap-2.5">
          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              type="button"
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
        
        <div className="flex items-center gap-3 justify-start flex-shrink-0">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value as 'injury-factor' | 'injury-type' | 'profession')}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer w-56"
          >
            <option value="injury-factor">Yếu tố chấn thương</option>
            <option value="injury-type">Loại chấn thương</option>
            <option value="profession">Danh mục nghề nghiệp</option>
          </select>

          <select
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer w-44"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Vô hiệu hóa</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse text-left text-xs">
              
              <thead>
                
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-normal text-[10px]">
                  <th className="py-3 px-2 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedItems.length > 0 &&
                        paginatedItems.every((item) => selectedIds.includes(item.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newIds = [...selectedIds];
                          paginatedItems.forEach((item) => {
                            if (!newIds.includes(item.id)) newIds.push(item.id);
                          });
                          setSelectedIds(newIds);
                        } else {
                          const pageIds = paginatedItems.map((item) => item.id);
                          setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                        }
                      }}
                      className="w-3.5 h-3.5 border-gray-300 rounded focus:ring-blue-500 cursor-pointer align-middle"
                    />
                  </th>

                  {activeCategory === 'injury-factor' && (
                    <>
                      <th className="py-3 px-3 w-40">Mã yếu tố</th>
                      <th className="py-3 px-3">Yếu tố gây chấn thương</th>
                      <th className="py-3 px-2 w-32 text-center">Trạng thái</th>
                    </>
                  )}

                  {activeCategory === 'injury-type' && (
                    <>
                      <th className="py-3 px-3 w-40">Mã số</th>
                      <th className="py-3 px-3">Tên loại chấn thương</th>
                      <th className="py-3 px-3 w-32">Cấp</th>
                      {canUpdate && <th className="py-3 px-2 w-24 text-center">Thao tác</th>}
                    </>
                  )}

                  {activeCategory === 'profession' && (
                    <>
                      {canUpdate && <th className="py-3 px-2 w-24 text-center">Thao tác</th>}
                      <th className="py-3 px-3 w-40">Mã nghề</th>
                      <th className="py-3 px-3">Tên nghề nghiệp</th>
                      <th className="py-3 px-3 w-32">Cấp</th>
                    </>
                  )}
                </tr>

                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-2 px-2"></th>

                  {activeCategory === 'profession' && canUpdate && (
                    <th className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchCode('');
                          setSearchName('');
                          setSearchLevel('');
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
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      placeholder="Tìm mã..."
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-800 placeholder-gray-450 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>

                  <th className="py-2 px-3">
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="Tìm tên..."
                      className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-800 placeholder-gray-450 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </th>

                  {activeCategory !== 'injury-factor' && (
                    <th className="py-2 px-3">
                      <select
                        value={searchLevel}
                        onChange={(e) => setSearchLevel(e.target.value)}
                        className="w-full px-1.5 py-1 border border-gray-200 rounded text-[11px] font-normal text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Chọn cấp</option>
                        <option value="Cấp 1">Cấp 1</option>
                        <option value="Cấp 2">Cấp 2</option>
                        <option value="Cấp 3">Cấp 3</option>
                        {activeCategory === 'profession' && <option value="Cấp 4">Cấp 4</option>}
                      </select>
                    </th>
                  )}

                  {activeCategory === 'injury-type' && canUpdate && (
                    <th className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchCode('');
                          setSearchName('');
                          setSearchLevel('');
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

                  {activeCategory === 'injury-factor' && (
                    <th className="py-2 px-2"></th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-gray-700">
                {isLoading ? (
                  <tr key="loading-row">
                    <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        Đang tải dữ liệu danh mục...
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr key="empty-row">
                    <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                      Không tìm thấy danh mục nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50/50 transition-colors ${
                        item.status === false ? 'opacity-60 bg-gray-50/20' : ''
                      }`}
                    >
                      
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => {
                            setSelectedIds((prev) =>
                              prev.includes(item.id)
                                ? prev.filter((id) => id !== item.id)
                                : [...prev, item.id]
                            );
                          }}
                          className="w-3.5 h-3.5 border-gray-300 rounded focus:ring-blue-500 cursor-pointer align-middle"
                        />
                      </td>

                      {activeCategory === 'injury-factor' && (
                        <>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">Mã {item.code}</td>
                          <td className="py-2.5 px-3 font-medium text-gray-800">{item.name}</td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex items-center justify-center">
                              {canUpdate ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(item)}
                                  className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                                    item.status !== false ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                                  }`}
                                  title="Thay đổi trạng thái yếu tố"
                                >
                                  <span className="bg-white w-3 h-3 rounded-full shadow-md" />
                                </button>
                              ) : (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  item.status !== false 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                    : 'bg-red-50 text-red-600 border-red-200'
                                }`}>
                                  {item.status !== false ? 'Hoạt động' : 'Khóa'}
                                </span>
                              )}
                            </div>
                          </td>
                        </>
                      )}

                      {activeCategory === 'injury-type' && (
                        <>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{item.code}</td>
                          <td className="py-2.5 px-3 text-gray-800 max-w-[320px] truncate" title={item.name}>
                            {renderCategoryName(item)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              {renderLevelBadge(item.level)}
                              {item.status === false && (
                                <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[9px] font-bold">
                                  Khóa
                                </span>
                              )}
                            </div>
                          </td>
                          {canUpdate && (
                            <td className="py-2.5 px-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(item)}
                                  className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                                    item.status !== false ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                                  }`}
                                  title={item.status !== false ? "Vô hiệu hóa loại chấn thương" : "Kích hoạt loại chấn thương"}
                                >
                                  <span className="bg-white w-3 h-3 rounded-full shadow-md" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                  title="Chỉnh sửa loại chấn thương"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </>
                      )}

                      {activeCategory === 'profession' && (
                        <>
                          {canUpdate && (
                            <td className="py-2.5 px-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(item)}
                                  className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                                    item.status !== false ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                                  }`}
                                  title={item.status !== false ? "Vô hiệu hóa nghề nghiệp" : "Kích hoạt nghề nghiệp"}
                                >
                                  <span className="bg-white w-3 h-3 rounded-full shadow-md" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                  title="Chỉnh sửa nghề nghiệp"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          )}
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{item.code}</td>
                          <td className="py-2.5 px-3 text-gray-800 max-w-[320px] truncate" title={item.name}>
                            {renderCategoryName(item)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              {renderLevelBadge(item.level)}
                              {item.status === false && (
                                <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[9px] font-bold">
                                  Khóa
                                </span>
                              )}
                            </div>
                          </td>
                        </>
                      )}

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredItems.length > 0 && (
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
                Hiển thị {filteredItems.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, filteredItems.length)} của {filteredItems.length} danh mục
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
          )}
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        categoryType={activeCategory}
        editItem={selectedItem}
        items={items}
      />

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-150 flex items-center h-12 overflow-hidden z-50 animate-fadeIn pr-4 font-sans select-none">
          <div className="bg-[#2F6BFF] text-white w-12 h-full flex items-center justify-center font-bold text-sm">
            {selectedIds.length}
          </div>
          
          <div className="px-4 text-gray-800 font-medium text-xs whitespace-nowrap">
            dữ liệu được chọn
          </div>
          
          <button
            type="button"
            onClick={handleBatchToggleStatus}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-8 px-3.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-3 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Vô hiệu hóa
          </button>

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

    </div>
  );
};
