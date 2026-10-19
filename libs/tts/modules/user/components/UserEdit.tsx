'use client';

import React from 'react';
import { UserForm } from './UserForm';

export interface UserEditProps {
  userIdProp: string | number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UserEdit: React.FC<UserEditProps> = ({
  userIdProp,
  onSuccess,
  onCancel,
}) => {
  return (
    <UserForm
      isModeCreate={false}
      userId={String(userIdProp)}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};

export default UserEdit;

