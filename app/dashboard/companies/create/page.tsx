'use client';

import React from 'react';
import dynamic from 'next/dynamic';
const CompanyForm = dynamic(
  () => import('@/libs/tts/modules/company/components/CompanyForm').then((mod) => mod.CompanyForm),
  { ssr: false }
);

export default function CreateCompanyPage() {
  return <CompanyForm />;
}
