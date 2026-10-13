'use client';

import React from 'react';
import { UserEdit } from '@/libs/tts/modules/user/components/UserEdit';
import { useParams, useRouter } from 'next/navigation';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  
  const userId = params?.id ? Number(params.id) : null; 

  return (
    <div className="flex-1 flex flex-col min-w-0 ">
      {userId ? (
        <UserEdit 
          userIdProp={userId}
          onSuccess={() => {
            router.push('/dashboard/users'); 
          }} 
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400 font-medium text-xs">
          ⚠️ Không tìm thấy ID người dùng hợp lệ trên đường dẫn URL
        </div>
      )}
    </div>
  );
}