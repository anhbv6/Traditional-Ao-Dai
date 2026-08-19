import { apiClient } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar?: string | null;
  birth?: string | null;
  gender?: string;
  role: string;
  isActive: boolean;
  isEmailVerified?: boolean;
}

export interface LoginResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
  };
}

export type RefreshTokenResponse = LoginResponse;

export interface MeResponse {
  status: string;
  statusCode: number;
  message: string;
  data: AuthUser;
}

type ApiMessageResponse<TData = null> = {
  status: string;
  statusCode: number;
  message: string;
  data: TData;
};

type OtpSendResponse = ApiMessageResponse<{
  success: boolean;
  ttl: number;
}>;

type ResetTokenResponse = ApiMessageResponse<{
  resetToken: string;
  expiresIn: number;
}>;

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
