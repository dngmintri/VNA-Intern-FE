'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/libs/tts/store/auth.store';

const ProfileForm = dynamic(
  () => import('@/libs/tts/modules/auth/components/ProfileForm').then((mod) => mod.ProfileForm),
  { ssr: false } 
);

const CompanyProfileForm = dynamic(
  () => import('@/libs/tts/modules/company/components/CompanyProfileForm').then((mod) => mod.CompanyProfileForm),
  { ssr: false }
);

export default function ProfilePage() {
  const { accountType } = useAuthStore();

  if (accountType === 'DOANH_NGHIEP' || accountType === 'DN') {
    return <CompanyProfileForm />;
  }

  return <ProfileForm />;
}