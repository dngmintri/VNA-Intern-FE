'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ReportView } from '@/libs/tts/modules/accident/ReportView';

export default function AdminReportViewPage() {
  const params = useParams();
  const idStr = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const reportId = String(idStr);

  return (
    <main className="flex-1 p-0 bg-white overflow-y-auto min-h-screen">
      <ReportView reportId={reportId} />
    </main>
  );
}
