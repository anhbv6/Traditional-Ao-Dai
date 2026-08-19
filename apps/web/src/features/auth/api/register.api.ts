import { apiClient } from '@/lib/api-client';
import { checkAccountApi } from './auth.api';
import { RegisterResponse, SendOtpResponse, VerifyOtpResponse } from '../types/auth.types';

/**
 * Registers a new customer account.
 */
export const registerApi = async (data: {
  registerType: 'email' | 'phone';
  name?: string;
  password?: string;
  email?: string;
  phone?: string;
  code?: string;
}): Promise<RegisterResponse> => {
  return apiClient.post<RegisterResponse>('/api/auth/register', data, { skipAuth: true, retryOnUnauthorized: false });
};

/**
 * Sends an OTP to the given phone number.
 */
export const sendOtpApi = async (phone: string, purpose: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD'): Promise<SendOtpResponse> => {
  return apiClient.post<SendOtpResponse>('/api/auth/otp/send', { phone, purpose }, { skipAuth: true, retryOnUnauthorized: false });
};

/**
 * Verifies an OTP code.
 */
export const verifyOtpApi = async (phone: string, purpose: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD', code: string): Promise<VerifyOtpResponse> => {
  return apiClient.post<VerifyOtpResponse>('/api/auth/otp/verify', { phone, purpose, code }, { skipAuth: true, retryOnUnauthorized: false });
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
