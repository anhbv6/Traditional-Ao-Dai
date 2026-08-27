export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  avatar?: string | null;
  birth?: string | null;
  gender?: number | string;
  role: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  socialAccounts?: Array<{
    id: string;
    provider: string;
    providerId: string;
  }>;
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

export interface VerifyOtpResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    isValid: boolean;
  } | null;
}
