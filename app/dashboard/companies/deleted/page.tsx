'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const CompanyDeleted = dynamic(
  () => import('@/libs/tts/modules/company/components/CompanyDeleted').then((mod) => mod.CompanyDeleted),
  { ssr: false }
);

export default function DeletedCompaniesPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <CompanyDeleted
        onBack={() => {
          router.push('/dashboard/companies');
        }}
      />
    </div>
  );
}
