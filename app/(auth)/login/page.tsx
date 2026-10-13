'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const LoginForm = dynamic(
  () => import('@/libs/tts/modules/auth/components/LoginForm').then((mod) => mod.LoginForm),
  { ssr: false }
);

export default function LoginPage() {
  return (
    <div >
      <LoginForm />
    </div>
  );
}