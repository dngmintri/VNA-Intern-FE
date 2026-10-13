'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/libs/tts/store/auth.store';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      router.replace('/dashboard');
    }
  }, [accessToken, router]);

  if (accessToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F6BFF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white select-none">
      
      <div className="w-screen h-screen bg-white grid grid-cols-1 lg:grid-cols-12 items-center">        
        
        <div className="hidden lg:flex lg:col-span-6 h-full items-center justify-center p-8 bg-white">
          <div className="relative w-full aspect-[4/3] max-w">
            <Image
              src="/login.png"
              alt="Phần mềm quản lý an toàn vệ sinh lao động minh họa"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        <div className="col-span-1 lg:col-span-6 w-full h-full flex items-center justify-center p-6 sm:p-12 bg-white">
          
          <div className="w-full max-w-[450px]">
            {children}
          </div>
          
        </div>

      </div>

    </div>
  );
}