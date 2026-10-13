'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/libs/tts/modules/auth/components/Sidebar';
import { api } from '@/libs/core/api/axios';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    const authStorage = localStorage.getItem('auth-storage');
    let hasToken = !!token;
    
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        if (parsed?.state?.accessToken) {
          hasToken = true;
        }
      } catch (e) {}
    }

    if (!hasToken) {
      window.location.replace('/login');
      return;
    }

    api.get('/report-periods').catch(() => {
    });
  }, []);
  return (
    <div className="flex h-screen w-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden no-print">
      <Sidebar />
      <div className="flex-1 h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
