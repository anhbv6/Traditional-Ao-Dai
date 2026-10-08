export { type AdminLoginFormValues } from "../validations/adminLogin.validation";

import { type ApiSuccess } from "@repo/shared";
import { type AdminSessionUser } from "../../server/adminAuth.server";

/** Token nằm trong cookie httpOnly, body chỉ trả thông tin người dùng */
export interface AdminLoginResponseData {
  user: AdminSessionUser;
}

export type AdminLoginApiResponse = ApiSuccess<AdminLoginResponseData> & { data: AdminLoginResponseData };
