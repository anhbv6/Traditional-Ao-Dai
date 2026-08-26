import { type AuthUser } from "@/features/auth/types/auth.types";
export { type AdminLoginFormValues } from "../validations/adminLogin.validation";

export interface AdminLoginResponseData {
  token?: string;
  accessToken?: string;
  user?: Partial<AuthUser>;
}

export interface AdminLoginApiResponse {
  status: string;
  statusCode?: number;
  message?: string;
  data: AdminLoginResponseData;
}
