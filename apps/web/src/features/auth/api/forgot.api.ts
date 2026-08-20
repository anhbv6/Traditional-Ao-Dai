import { apiClient } from "@/lib/api-client";
import { ApiMessageResponse, ResetTokenResponse } from "../types/auth.types";


export const forgotPasswordEmailApi = async (email: string): Promise<ApiMessageResponse> => {
  return apiClient.post<ApiMessageResponse>('/api/auth/forgot-password/email', { email }, { skipAuth: true, retryOnUnauthorized: false });
};

export const verifyResetPasswordEmailApi = async (data: { email: string; code: string }): Promise<ResetTokenResponse> => {
  return apiClient.post<ResetTokenResponse>('/api/auth/forgot-password/email/verify', data, { skipAuth: true, retryOnUnauthorized: false });
};

export const verifyResetPasswordPhoneApi = async (data: { phone: string; code: string }): Promise<ResetTokenResponse> => {
  return apiClient.post<ResetTokenResponse>('/api/auth/forgot-password/phone/verify', data, { skipAuth: true, retryOnUnauthorized: false });
};

export const resetPasswordPhoneApi = async (data: { phone: string; code?: string; resetToken?: string; password: string }): Promise<ApiMessageResponse> => {
  return apiClient.post<ApiMessageResponse>('/api/auth/reset-password/phone', data, { skipAuth: true, retryOnUnauthorized: false });
};

export const resetPasswordEmailApi = async (data: { email: string; code?: string; resetToken?: string; password: string }): Promise<ApiMessageResponse> => {
  return apiClient.post<ApiMessageResponse>('/api/auth/reset-password/email', data, { skipAuth: true, retryOnUnauthorized: false });
};