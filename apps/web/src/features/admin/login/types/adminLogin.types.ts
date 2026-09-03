export { type AdminLoginFormValues } from "../validations/adminLogin.validation";

export interface AdminUserPayload {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  birth?: string | null;
  gender?: number | null;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  staffPermission?: any;
}

export interface AdminLoginResponseData {
  token: string;
  accessToken: string;
  user: AdminUserPayload;
}

export interface AdminLoginApiResponse {
  status: "success" | "error" | string;
  statusCode?: number;
  message?: string;
  data: AdminLoginResponseData;
}
