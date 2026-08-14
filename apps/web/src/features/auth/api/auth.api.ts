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
