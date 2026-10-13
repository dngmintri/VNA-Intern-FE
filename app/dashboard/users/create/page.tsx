'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const UserForm = dynamic(
  () => import('@/libs/tts/modules/user/components/UserForm').then((mod) => mod.UserForm),
  { ssr: false }
);

export default function CreateUserPage() {
  const router = useRouter(); 

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <UserForm 
        isModeCreate={true} 
        onSuccess={() => {
          router.push('/dashboard/users'); 
        }} 
      />
    </div>
  );
}