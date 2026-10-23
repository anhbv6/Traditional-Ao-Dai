import { apiClient } from '@/lib/api-client';
import { type CheckAccountResponse, type OtpSendResponse, type RegisterResponse } from '../types/auth.types';

/**
 * Gửi mã xác minh tới email — bước 1 của đăng ký bằng email
 */
export const sendRegisterEmailCodeApi = async (email: string): Promise<OtpSendResponse> => {
  return apiClient.post<OtpSendResponse>('/api/auth/register/email/code', { email }, { skipAuth: true, retryOnUnauthorized: false });
};

/**
 * Tạo tài khoản sau khi đã xác minh mã (mã email hoặc OTP SĐT)
 */
export const registerApi = async (
  data: { name?: string; password: string; code: string } & (
    | { registerType: 'email'; email: string }
    | { registerType: 'phone'; phone: string }
  )
): Promise<RegisterResponse> => {
  return apiClient.post<RegisterResponse>('/api/auth/register', data, { skipAuth: true, retryOnUnauthorized: false });
};

/**
 * Checks email availability using the real API endpoint.
 */
export const checkEmailApi = async (email: string): Promise<{ isTaken: boolean; reason?: string }> => {
  try {
    const res = await checkAccountApi({ email });
    return {
      isTaken: !res.data?.available,
      reason: res.data?.reason,
    };
  } catch (error) {
    console.error('Failed to check email availability via API:', error);
    return { isTaken: false };
  }
};

/**
 * Checks phone number availability using the real API endpoint.
 */
export const checkPhoneApi = async (phone: string): Promise<{ isTaken: boolean; reason?: string }> => {
  try {
    const res = await checkAccountApi({ phone });
    return {
      isTaken: !res.data?.available,
      reason: res.data?.reason,
    };
  } catch (error) {
    console.error('Failed to check phone availability via API:', error);
    return { isTaken: false };
  }
};


export const checkAccountApi = async (params: { email?: string; phone?: string }): Promise<CheckAccountResponse> => {
  return apiClient.get<CheckAccountResponse>('/api/auth/check-account', { params, skipAuth: true, retryOnUnauthorized: false });
};