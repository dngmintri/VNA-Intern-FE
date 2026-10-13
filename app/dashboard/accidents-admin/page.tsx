'use client';

import React from 'react';
import { AccidentAdmin } from '@/libs/tts/modules/accident/admin';

export default function AccidentsAdminPage() {
  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[#F4F6F9] select-none">
      <AccidentAdmin />
    </main>
  );
}
