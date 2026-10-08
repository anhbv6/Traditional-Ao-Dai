import { apiClient } from '@/lib/api-client';
import { CheckAccountResponse, RegisterResponse} from '../types/auth.types';

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