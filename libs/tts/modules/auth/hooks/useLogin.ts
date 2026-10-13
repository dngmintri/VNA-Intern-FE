import { useState, useEffect } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '../schemas/login.schema';
import { loginApi } from '../api/auth.api';
import { useAuthStore } from '../../../store/auth.store';
import toast from 'react-hot-toast';
import axios from 'axios';

export const useLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setAccessToken, setRefreshToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUsername = localStorage.getItem('remembered_username');
      if (savedUsername) {
        setValue('username', savedUsername);
        setValue('rememberMe', true);
      }
    }
  }, [setValue]);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const res = await loginApi(data);
      console.log(res);

      const accessToken = res.data?.accessToken || res.accessToken;
      const refreshToken = res.data?.refreshToken || res.refreshToken;

      if (!accessToken) {
        toast.error(res.message || 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt!');
        setIsLoading(false);
        return;
      }

      if (data.rememberMe) {
        localStorage.setItem('remembered_username', data.username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      localStorage.setItem('current_username', data.username);
      
      localStorage.setItem('token', accessToken);
      setAccessToken(accessToken);

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        setRefreshToken(refreshToken);
      }

      toast.success(res.message || 'Đăng nhập thành công!');
      window.location.href = '/dashboard';
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const backendMessage = (error.response?.data as Record<string, unknown>)?.message;
        if (error.response?.status === 403 || String(backendMessage).includes('khóa') || String(backendMessage).toLowerCase().includes('active')) {
          toast.error(Array.isArray(backendMessage) ? String(backendMessage[0]) : String(backendMessage || 'Tài khoản đã bị khóa!'));
          return;
        }
      }

      toast.error('Tài khoản hoặc mật khẩu không đúng. Xin vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = (validationErrors: FieldErrors<LoginInput>) => {
    const firstError = validationErrors.username?.message || validationErrors.password?.message;
    if (firstError) {
      toast.error(firstError);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit, onInvalid),
    errors,
    showPassword,
    togglePasswordVisibility,
    isLoading,
  };
};