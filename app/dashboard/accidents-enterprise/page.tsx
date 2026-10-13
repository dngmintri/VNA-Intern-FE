'use client';

import React from 'react';
import { Enterprise } from '@/libs/tts/modules/accident/enterprise';

export default function AccidentsEnterprisePage() {
  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[#F4F6F9] select-none">
      <Enterprise />
    </main>
  );
}