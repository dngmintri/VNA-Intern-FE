'use client';

import dynamic from 'next/dynamic';
const UserList = dynamic(
  () => import('@/libs/tts/modules/user/components/UserList').then((mod) => mod.UserList),
  { ssr: false }
);

export default function UsersManagementPage() {
  return <UserList />;
}