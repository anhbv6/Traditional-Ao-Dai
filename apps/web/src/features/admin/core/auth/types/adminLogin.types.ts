export { type AdminLoginFormValues } from "../validations/adminLogin.validation";

import { type ApiSuccess } from "@repo/shared";

/** Token nằm trong cookie httpOnly; thông tin người dùng đọc lại từ server qua getAdminSessionAction */
export interface AdminLoginResponseData {
  role: "ADMIN" | "STAFF";
}

export type AdminLoginApiResponse = ApiSuccess<AdminLoginResponseData> & { data: AdminLoginResponseData };
