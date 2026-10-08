import { type ProfilePayload, type UpdateProfileResponse } from "../types/profile.types";
import { apiClient } from "@/lib/api-client";

export const updateProfileApi = (payload: ProfilePayload): Promise<UpdateProfileResponse> => {
  return apiClient.put<UpdateProfileResponse>("/api/user/profile", payload);
};

type SendCodeResponse = { status: string; statusCode: number; message: string; data: { ttl: number } };

/**
 * Gửi mã xác minh tới email (email mới muốn đổi sang hoặc email hiện tại chưa xác minh)
 */
export const requestEmailVerificationApi = (email: string): Promise<SendCodeResponse> => {
  return apiClient.post<SendCodeResponse>("/api/user/email/verification", { email });
};

/**
 * Xác nhận mã email -> trả về thông tin người dùng đã cập nhật
 */
export const confirmEmailVerificationApi = (email: string, code: string): Promise<UpdateProfileResponse> => {
  return apiClient.post<UpdateProfileResponse>("/api/user/email/verification/confirm", { email, code });
};

/**
 * Gửi OTP tới SĐT (SĐT mới muốn đổi sang hoặc SĐT hiện tại chưa xác minh)
 */
export const requestPhoneVerificationApi = (phone: string): Promise<SendCodeResponse> => {
  return apiClient.post<SendCodeResponse>("/api/user/phone/verification", { phone });
};

/**
 * Xác nhận OTP SĐT -> trả về thông tin người dùng đã cập nhật
 */
export const confirmPhoneVerificationApi = (phone: string, code: string): Promise<UpdateProfileResponse> => {
  return apiClient.post<UpdateProfileResponse>("/api/user/phone/verification/confirm", { phone, code });
};

