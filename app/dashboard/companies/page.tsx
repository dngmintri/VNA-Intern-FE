'use client';

import React from 'react';
import dynamic from 'next/dynamic';
const CompanyList = dynamic(
  () => import('@/libs/tts/modules/company/components/CompanyList').then((mod) => mod.CompanyList),
  { ssr: false }
);

export default function CompaniesPage() {
  return <CompanyList />;
}
