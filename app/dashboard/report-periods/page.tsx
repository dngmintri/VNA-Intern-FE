'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ReportPeriodList = dynamic(
  () =>
    import('@/libs/tts/modules/report-period/components/ReportPeriodList').then(
      (mod) => mod.ReportPeriodList
    ),
  { ssr: false }
);

export default function ReportPeriodsPage() {
  return <ReportPeriodList />;
}
