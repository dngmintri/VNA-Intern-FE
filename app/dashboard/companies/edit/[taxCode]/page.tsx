'use client';

import React, { use } from 'react';
import dynamic from 'next/dynamic';
const CompanyForm = dynamic(
  () => import('@/libs/tts/modules/company/components/CompanyForm').then((mod) => mod.CompanyForm),
  { ssr: false }
);

interface EditCompanyPageProps {
  params: Promise<{ taxCode: string }>;
}

export default function EditCompanyPage({ params }: EditCompanyPageProps) {
  const resolvedParams = use(params);
  const taxCode = resolvedParams.taxCode;

  return <CompanyForm taxCode={taxCode} />;
}
