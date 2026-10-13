import { api } from "@/libs/core/api/axios";
import {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "@/libs/shared/interfaces/auth.interface";

export const loginApi = async (
  payload: LoginRequest
): Promise<LoginResponse> => {
  const { data } = await api.post(
    "/auth/login",
    payload
  );
  return data;
};

export const forgotPasswordApi = async (
  payload: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  const { data } = await api.post(
    "/auth/forgot-password",
    payload
  );
  return data;
};

export const resetPasswordApi = async (
  payload: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  const { data } = await api.post(
    "/auth/reset-password",
    payload
  );
  return data;
};
