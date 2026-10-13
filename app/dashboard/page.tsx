'use client';

import React from 'react';
import Image from 'next/image';

export default function DashboardPage() {
  return (
    <main className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-2xl text-center space-y-6 animate-fadeIn">
        <h1 className="text-xl md:text-2xl font-extrabold text-[#2F6BFF] tracking-tight">
          HỆ THỐNG QUẢN LÝ AN TOÀN VỆ SINH LAO ĐỘNG
        </h1>
        <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Chào mừng bạn đến với phần mềm quản lý báo cáo tai nạn lao động. Vui lòng lựa chọn các chức năng tương ứng tại menu bên trái để thực hiện tác vụ.
        </p>
        <div className="relative w-full aspect-[4/3] max-w-sm mx-auto mt-2">
          <Image
            src="/login.png"
            alt="Phần mềm quản lý an toàn vệ sinh lao động minh họa"
            fill
            priority
            className="object-contain"
          />
        </div>
      </div>
    </main>
  );
}