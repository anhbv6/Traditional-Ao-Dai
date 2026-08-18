import { apiClient } from '@/lib/api-client';

export interface CheckAccountResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    available: boolean;
    reason: 'EMAIL_TAKEN' | 'PHONE_TAKEN' | 'AVAILABLE';
  };
}

/**
 * Check if email or phone is already registered in the system.
 */
export const checkAccountApi = async (params: { email?: string; phone?: string }): Promise<CheckAccountResponse> => {
  return apiClient.get<CheckAccountResponse>('/api/auth/check-account', { params, skipAuth: true, retryOnUnauthorized: false });
};

/**
 * Checks email availability using the real API endpoint.
 */
export const mockCheckEmailApi = async (email: string): Promise<{ isTaken: boolean; reason?: string }> => {
  try {
    const res = await checkAccountApi({ email });
    return {
      isTaken: !res.data?.available,
      reason: res.data?.reason
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
      reason: res.data?.reason
    };
  } catch (error) {
    console.error('Failed to check phone availability via API:', error);
    return { isTaken: false };
  }
};

export interface RegisterResponse {
  status: string;
  statusCode: number;
  message: string;
  data: null;
}

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

export interface SendOtpResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    success: boolean;
    ttl: number;
  } | null;
}

export const sendOtpApi = async (phone: string, purpose: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD'): Promise<SendOtpResponse> => {
  return apiClient.post<SendOtpResponse>('/api/auth/otp/send', { phone, purpose }, { skipAuth: true, retryOnUnauthorized: false });
};

export interface VerifyOtpResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    isValid: boolean;
  } | null;
}

export const verifyOtpApi = async (phone: string, purpose: 'REGISTER' | 'LOGIN' | 'RESET_PASSWORD', code: string): Promise<VerifyOtpResponse> => {
  return apiClient.post<VerifyOtpResponse>('/api/auth/otp/verify', { phone, purpose, code }, { skipAuth: true, retryOnUnauthorized: false });
};


