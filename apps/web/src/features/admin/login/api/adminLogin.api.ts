import { apiClient } from "@/lib/api-client";
import { type AdminLoginApiResponse, type AdminLoginFormValues } from "../types/adminLogin.types";

export const adminLoginApi = async (
  credentials: AdminLoginFormValues
): Promise<AdminLoginApiResponse> => {
  return apiClient.post<AdminLoginApiResponse>(
    "/api/auth/admin/login",
    {
      email: credentials.email.trim(),
      password: credentials.password,
      rememberMe: credentials.rememberMe,
    },
    { skipAuth: true, retryOnUnauthorized: false }
  );
};

export const adminLogoutApi = async (): Promise<{ status: string; message?: string }> => {
  return apiClient.post<{ status: string; message?: string }>(
    "/api/auth/admin/logout",
    {},
    { retryOnUnauthorized: false }
  );
};
