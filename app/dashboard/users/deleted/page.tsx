'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const UserDeleted = dynamic(
  () => import('@/libs/tts/modules/user/components/UserDeleted').then((mod) => mod.UserDeleted),
  { ssr: false }
);

export default function DeletedUsersPage() {
  const router = useRouter(); 

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <UserDeleted
        onBack={() => {
          router.push('/dashboard/users'); 
        }} 
      />
    </div>
  );
}