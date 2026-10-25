'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/libs/core/api/axios';
import { useAuthStore } from '@/libs/tts/store/auth.store';
import { AxiosError } from 'axios';
import { usePathname } from 'next/navigation';
interface MenuItem {
  title: string;
  icon: React.ReactNode;
  children?: string[];
  key?: string;
  href?: string;
}

interface SidebarUserResponse {
  code?: number;
  message?: string;
  success?: boolean;
  username?: string;
  fullName?: string | null;
  avatar?: string | null;
  data?: {
    username?: string;
    fullName?: string | null;
    avatar?: string | null;
  };
}

// Danh sách các nút menu tạm thời ẩn (giữ nguyên logic code, chỉ ẩn khỏi giao diện)
const HIDDEN_MENU_BUTTONS: string[] = [
  // 'Quản lý người dùng',
  // 'Quản lý doanh nghiệp',
  'Kỳ báo cáo',
  'Danh mục chung',
  'TNLĐ theo HĐLĐ',
];

// Cấu hình: true = ẩn nhóm cha nếu không có con; false = vẫn luôn hiển thị nhóm cha
const HIDE_EMPTY_PARENT_GROUPS = false;

const formatAvatarUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const Sidebar = () => {
  const { logout, avatar, fullName, setAvatar, setFullName, accountType } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const getInitials = (name: string | null) => {
    if (!name || name === 'Đang tải...' || name === 'Người dùng') return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0];
    const last = parts[parts.length - 1];
    return (first.charAt(0) + (last ? last.charAt(0) : '')).toUpperCase();
  };

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showOldPass, setShowOldPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    heThong: false,
    taiNanLaoDong: false,
  });
  useEffect(() => {
    if (
      pathname.startsWith('/dashboard/users') ||
      pathname.startsWith('/dashboard/companies')
    ) {
      setOpenMenus((prev) => ({
        ...prev,
        heThong: true,
      }));
    } else if (
      pathname.startsWith('/dashboard/accidents-admin') ||
      pathname.startsWith('/dashboard/accidents-enterprise')
    ) {
      setOpenMenus((prev) => ({
        ...prev,
        taiNanLaoDong: true,
      }));
    }
  }, [pathname]);
  useEffect(() => {
    const fetchSidebarUserInfo = async () => {
      try {
        const response = await api.get<SidebarUserResponse>('/users/profile');
        const userData = response.data?.data || response.data;
        
        if (userData) {
          const name = userData.fullName || userData.username || localStorage.getItem('current_username') || 'Người dùng';
          setFullName(name);
          setAvatar(formatAvatarUrl(userData.avatar) || null);
        } else {
          const currentUsername = localStorage.getItem('current_username') || 'Người dùng';
          setFullName(currentUsername);
          setAvatar(null);
        }
      } catch (error) {
        console.error('Lỗi khi lấy tên hiển thị Sidebar:', error);
        if (!fullName) {
          const currentUsername = localStorage.getItem('current_username') || 'Người dùng';
          setFullName(currentUsername);
        }
      }
    };

    fetchSidebarUserInfo();
  }, [setAvatar, setFullName, fullName]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleSubMenu = (menuKey: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu cũ');
      return;
    }
    if (!newPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (oldPassword === newPassword) {
      toast.error('Mật khẩu mới không được trùng với mật khẩu cũ hiện tại');
      return;
    }

    if (!confirmPassword.trim()) {
      toast.error('Vui lòng xác nhận mật khẩu mới');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp, vui lòng nhập lại');
      return;
    }

    setIsChangingPassword(true);

try {
      const response = await api.post('/auth/change-password', {
        password: oldPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(response.data?.message || 'Đổi mật khẩu thành công! Hệ thống sẽ tự độn đăng xuất ngay bây giờ!');
      
      setShowChangePasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        logout();
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('current_username');
        
        window.location.href = '/login';
      }, 1500);

    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      
      if (axiosError.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn! Hệ thống tự động đăng xuất...');
        
        setTimeout(() => {
          logout();
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('current_username');
          window.location.href = '/login';
        }, 1500);
        return;
      }

      const errMsg = axiosError.response?.data?.message || 'Đổi mật khẩu thất bại';
      toast.error(errMsg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const menuItems: MenuItem[] = (accountType === 'DOANH_NGHIEP' || accountType === 'DN')
    ? [
        {
          title: 'Hệ thống',
          key: 'heThong',
          icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ),
          children: ['Thông tin doanh nghiệp'],
        },
        {
          title: 'Tai nạn lao động',
          key: 'taiNanLaoDong',
          icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          children: ['TNLĐ theo HĐLĐ'],
        },
      ]
    : [
        {
          title: 'Hệ thống',
          key: 'heThong',
          icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ),
          children: ['Quản lý người dùng', 'Quản lý doanh nghiệp', 'Kỳ báo cáo'],
        },
        {
          title: 'Tai nạn lao động',
          key: 'taiNanLaoDong',
          icon: (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          children: ['Danh mục chung', 'TNLĐ theo HĐLĐ'],
        },
      ];

  return (
    <aside className={`bg-[#112E83] text-white flex flex-col justify-between min-h-screen select-none flex-shrink-0 font-sans shadow-lg transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      <div>
        <div className={`p-4 bg-[#112E83] flex items-center border-b border-white/20 transition-all ${isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 relative flex-shrink-0 drop-shadow-md">
              <Image
                src="/quochuy.png"
                alt="Quốc huy Việt Nam"
                fill
                priority
                sizes="36px"
                className="object-contain"
              />
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-[11px] leading-tight text-white animate-fadeIn whitespace-normal">
                Ủy ban nhân dân Thành phố Hồ Chí Minh
              </span>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:text-gray-200 p-1 transition-colors rounded hover:bg-white/10"
            title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

    <nav className="p-2.5 space-y-0.5 text-xs select-none">
    {menuItems
      .map((item) => ({
        ...item,
        children: item.children?.filter((child) => !HIDDEN_MENU_BUTTONS.includes(child)),
      }))
      .filter((item) => !HIDE_EMPTY_PARENT_GROUPS || !item.children || item.children.length > 0 || item.href)
      .map((item, index) => {
        const hasChildren = !!item.children && item.children.length > 0;
        const isMenuOpen = item.key ? openMenus[item.key] : false;
        const isItemActive = item.href ? pathname.startsWith(item.href) : (hasChildren && isMenuOpen && !isCollapsed);

        const itemContent = (
          <div
            title={isCollapsed ? item.title : undefined}
            className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                isItemActive
                ? 'bg-[#163691] text-white' 
                : 'text-gray-200 hover:bg-[#163691]/60 hover:text-white'
            } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            <div className="flex items-center gap-3 truncate">
                <span className="text-gray-300 flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                <span className="font-medium tracking-wide truncate">{item.title}</span>
                )}
            </div>
            
            {hasChildren && !isCollapsed && (
                <span className={`text-[9px] text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}>
                ▼
                </span>
            )}
          </div>
        );

        return (
        <div key={index} className="w-full text-left"> 
            {item.href ? (
              <Link href={item.href} className="block w-full">
                {itemContent}
              </Link>
            ) : (
              <div
                onClick={() => {
                    if (isCollapsed) {
                    setIsCollapsed(false);
                    if (hasChildren && item.key) {
                        setOpenMenus((prev) => ({ ...prev, [item.key!]: true }));
                    }
                    return;
                    }
                    
                    if (hasChildren && item.key) {
                    toggleSubMenu(item.key);
                    }
                }}
              >
                {itemContent}
              </div>
            )}

          {hasChildren && isMenuOpen && !isCollapsed && (
            <div className="mt-0.5 pl-0 space-y-0.5 border-l border-white/10 ml-5 flex flex-col items-start justify-start">
              {item.children?.map((child, cIndex) => {
                let href = '#';
                if (child === 'Quản lý doanh nghiệp') {
                  href = '/dashboard/companies';
                } else if (child === 'Quản lý người dùng') {
                  href = '/dashboard/users';
                } else if (child === 'Thông tin doanh nghiệp') {
                  href = '/dashboard/profile';
                } else if (child === 'TNLĐ theo HĐLĐ') {
                  href = (accountType === 'DOANH_NGHIEP' || accountType === 'DN')
                    ? '/dashboard/accidents-enterprise'
                    : '/dashboard/accidents-admin';
                } else if (child === 'Kỳ báo cáo') {
                  href = '/dashboard/report-periods';
                } else if (child === 'Danh mục chung') {
                  href = '/dashboard/categories';
                }
                  
                return (
                  <Link
                    key={cIndex}
                    href={href}
                    className={`w-full flex items-center !justify-start !text-left py-2 px-3 rounded-md font-medium tracking-wide transition-colors
                    ${
                      pathname.startsWith(href) && href !== '#'
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="mr-2 opacity-60 flex-shrink-0 text-[15px]">•</span>
                    <span className="truncate">{child}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        );
    })}
    </nav>
      </div>

      <div ref={userMenuRef} className="p-3 border-t border-white/20 relative bg-transparent">
        {showUserMenu && (
          <div className={`absolute bottom-16 bg-white text-gray-700 rounded-xl shadow-2xl py-1.5 border border-gray-100 z-50 text-xs font-medium space-y-0.5 transition-all ${isCollapsed ? 'left-16 w-[180px]' : 'left-3 right-3'}`}>
            {accountType !== 'DOANH_NGHIEP' && accountType !== 'DN' && (
              <Link 
                href="/dashboard/profile"
                onClick={() => setShowUserMenu(false)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Thông tin tài khoản
              </Link>
            )}
            
            <button 
              onClick={() => {
                setShowUserMenu(false);
                setShowChangePasswordModal(true);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
              Đổi mật khẩu
            </button>
            
            <button 
              onClick={() => {
                logout();
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2.5 text-red-600 border-t border-gray-100 mt-1 pt-2"
            >
              <svg className="w-5 h-5 text-[#FF5A4E] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Đăng xuất
            </button>
          </div>
        )}

        <div
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex items-center p-2 pb-3 border-b border-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gray-200 border border-white/20 flex-shrink-0 flex items-center justify-center text-[#112E83] font-bold text-sm shadow-inner overflow-hidden relative">
              <Image 
                key={avatar || "default"}
                src={formatAvatarUrl(avatar) || "/avatar-sample.png"} 
                alt="Avatar"
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {getInitials(fullName)}
            </div>
            
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-sm font-medium tracking-wide text-white truncate">
                  {fullName || 'Đang tải...'}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && <span className="text-white text-xs pr-1 font-bold">❯</span>}
        </div>
      </div>

      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden animate-fadeIn text-gray-700">
            
            <div className="bg-[#2F6BFF] text-white text-center py-4 font-bold text-base">
              Đổi mật khẩu
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-6">
              
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-gray-400 select-none z-10">
                  Mật khẩu cũ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder-gray-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                  >
                    {showOldPass ? (<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) : (<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>)}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-gray-400 select-none z-10">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder-gray-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                  >
                    {showNewPass ? (<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) : (<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>)}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-semibold text-gray-400 select-none z-10">
                  Nhập lại mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 text-sm text-gray-900 placeholder-gray-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                  >
                    {showConfirmPass ? (<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) : (<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>)}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all disabled:bg-blue-400"
                >
                  {isChangingPassword ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </aside>
  );
};