'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const AccidentAdmin = dynamic(
  () =>
    import('@/libs/tts/modules/accident/admin').then(
      (mod) => mod.AccidentAdmin
    ),
  { ssr: false }
);

export default function AccidentsAdminPage() {
  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[#F4F6F9] select-none">
      <AccidentAdmin />
    </main>
  );
}
