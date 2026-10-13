'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ReportView } from '@/libs/tts/modules/accident/ReportView';

export default function EditReportPage() {
  const params = useParams();
  const reportId = Number(params.id);

  return (
    <main className="flex-1 p-0 bg-white overflow-y-auto">
      <ReportView reportId={reportId} />
    </main>
  );
}