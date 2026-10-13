'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ForgotPasswordForm = dynamic(
  () =>
    import('@/libs/tts/modules/auth/components/ForgotPasswordForm').then(
      (mod) => mod.ForgotPasswordForm
    ),
  { ssr: false }
);

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
