import { apiClient } from '@/lib/api-client';
import {
  LoginResponse,
  RefreshTokenResponse,
  MeResponse,
  OtpSendResponse,
} from '../types/auth.types';

/**
 * Sends a client credentials login request to the backend.
 */
export const loginApi = async (data: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/api/auth/login', data, { skipAuth: true, retryOnUnauthorized: false });
};

export const refreshTokenApi = async (): Promise<RefreshTokenResponse> => {
  return apiClient.post<RefreshTokenResponse>('/api/auth/refresh-token', {}, {
    skipAuth: true,
    retryOnUnauthorized: false,
  });
};

/**
 * Đăng xuất khách hàng: Backend xóa phiên và cookie (refreshToken, has_session)
 */
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
  rememberMe?: boolean;
}): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/api/auth/login/otp', data, { skipAuth: true, retryOnUnauthorized: false });
};

export const loginWithGoogleApi = async (credential: string, rememberMe: boolean = true): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/api/auth/google', { credential, rememberMe }, { skipAuth: true, retryOnUnauthorized: false });
};
