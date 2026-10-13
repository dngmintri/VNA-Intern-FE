'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ReportFormWizard } from '@/libs/tts/modules/accident/ReportFormWizard';

export default function EditReportPage() {
  const params = useParams();
  const reportId = Number(params.id);

  return (
    <main className="flex-1 p-0 bg-white overflow-y-auto">
      <ReportFormWizard reportId={reportId}
       />
    </main>
  );
}