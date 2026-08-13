import { apiClient } from '@/lib/api-client';

export interface LoginResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    user: {
      id: string;
      email: string;
      name: string | null;
      phone: string | null;
      role: string;
      isActive: boolean;
    };
  };
}

export type RefreshTokenResponse = LoginResponse;

/**
 * Sends a client credentials login request to the backend.
 */
export const loginApi = async (data: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/auth/client/login', data);
};

export const refreshTokenApi = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  return apiClient.post<RefreshTokenResponse>(
    '/auth/client/refresh-token',
    { refreshToken },
    { skipAuth: true, retryOnUnauthorized: false }
  );
};

export const logoutApi = async (refreshToken?: string): Promise<void> => {
  await apiClient.post('/auth/client/logout', refreshToken ? { refreshToken } : {});
};
