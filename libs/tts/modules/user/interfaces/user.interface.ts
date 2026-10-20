export interface UserItem {
  id: string | number;
  accountId?: number | string;
  fullName: string;
  username: string;
  email: string;
  avatar?: string | null;
  role?: string;
  roleId?: number;
  position?: string;
  isActive?: boolean;
  gender?: 'male' | 'female' | string;
  dateOfBirth?: string | null;
  province?: string | null;
  district?: string | null;
  streetAddress?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendUserItem {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
  dateOfBirth?: string | null;
  province?: string | null;
  district?: string | null;
  streetAddress?: string | null;
  createdAt?: string;
  updatedAt?: string;
  accountId?: number;
  role?: { id: number; name: string } | string;
  position?: string;
  isActive?: boolean;
}

export interface BackendUserListResponse {
  data?: {
    items: BackendUserItem[];
    count?: number;
    pageNumber?: number;
    pageSize?: number;
  };
  items?: BackendUserItem[];
  count?: number;
  pageNumber?: number;
  pageSize?: number;
  success?: boolean;
  code?: number;
  message?: string;
}

export interface UserPreviewItem {
  id: number;
  accountId: number;
  fullName: string;
  username: string;
  email: string;
  avatar?: string | null;
  role: string;
  position: string;
  isActive: boolean;
  rowNumber?: number;
  dateOfBirth?: string;
  gender?: string;
  province?: string;
  ward?: string;
  address?: string;
  isValid: boolean;
  errors: string[];
}

export interface CreateUserInput {
  username: string;
  password: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  position?: string | null;
  isActive?: boolean;
  role?: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string | null;
  province?: string | null;
  district?: string | null;
  streetAddress?: string | null;
}

export interface UpdateUserInput {
  fullName?: string;
  avatar?: string | null;
  position?: string | null;
  isActive?: boolean;
  role?: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string | null;
  province?: string | null;
  district?: string | null;
  streetAddress?: string | null;
}
