import { apiClient } from '@/lib/api-client';
import {
  LoginResponse,
  RefreshTokenResponse,
  MeResponse,
  OtpSendResponse,
  ResetTokenResponse,
  ApiMessageResponse,
  CheckAccountResponse,
} from '../types/auth.types';

/**
 * Sends a client credentials login request to the backend.
 */
export const loginApi = async (data: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/api/auth/login', data, { skipAuth: true, retryOnUnauthorized: false });
};

export const refreshTokenApi = async (): Promise<RefreshTokenResponse> => {
  return apiClient.post<RefreshTokenResponse>('/api/auth/refresh', {}, { skipAuth: true, retryOnUnauthorized: false });
};

export const logoutApi = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout', {}, { retryOnUnauthorized: false });
};

export const getMeApi = async (): Promise<MeResponse> => {
  return apiClient.get<MeResponse>('/api/auth/me');
};

export const sendOtpApi = async (phone: string, purpose: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD'): Promise<OtpSendResponse> => {
  return apiClient.post<OtpSendResponse>('/api/auth/otp/send', { phone, purpose }, { skipAuth: true, retryOnUnauthorized: false });
};

export const loginWithOtpApi = async (data: {
  phone: string;
  code: string;
}): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/api/auth/login/otp', data, { skipAuth: true, retryOnUnauthorized: false });
};

export const loginWithGoogleApi = async (credential: string): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/api/auth/google', { credential }, { skipAuth: true, retryOnUnauthorized: false });
};

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

export const checkAccountApi = async (params: { email?: string; phone?: string }): Promise<CheckAccountResponse> => {
  return apiClient.get<CheckAccountResponse>('/api/auth/check-account', { params, skipAuth: true, retryOnUnauthorized: false });
};