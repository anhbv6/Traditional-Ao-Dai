import { type UserDto } from '@repo/shared';

/** Người dùng storefront đang đăng nhập — đúng hợp đồng `UserDto` do Backend trả về */
export type AuthUser = UserDto;

export interface LoginResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
  };
}

export interface MeResponse {
  status: string;
  statusCode: number;
  message: string;
  data: AuthUser;
}

export interface CheckAccountResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    available: boolean;
    reason: 'EMAIL_TAKEN' | 'PHONE_TAKEN' | 'AVAILABLE';
  };
}

export interface ApiMessageResponse<TData = null> {
  status: string;
  statusCode: number;
  message: string;
  data: TData;
}

export type OtpSendResponse = ApiMessageResponse<{
  success: boolean;
  ttl: number;
}>;

export type ResetTokenResponse = ApiMessageResponse<{
  resetToken: string;
  expiresIn: number;
}>;

export interface RegisterResponse {
  status: string;
  statusCode: number;
  message: string;
  data: null;
}

export type SendOtpResponse = OtpSendResponse;

