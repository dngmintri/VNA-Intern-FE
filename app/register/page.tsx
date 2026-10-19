'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const RegisterForm = dynamic(
  () => import('@/libs/tts/modules/auth/components/RegisterForm').then((mod) => mod.RegisterForm),
  { ssr: false }
);

export default function RegisterPage() {
  return <RegisterForm />;
}
