import * as z from "zod";
import { ORDER_CODE_REGEX, normalizeOrderCode } from "@repo/shared/orders";

/** Form tra cứu đơn (cơ chế A). Mã lỗi là KEY, dịch qua `Errors` */
export const lookupSchema = z.object({
  orderCode: z
    .string()
    .trim()
    .min(1, "ORDER_CODE_INVALID")
    .transform(normalizeOrderCode)
    .pipe(z.string().regex(ORDER_CODE_REGEX, "ORDER_CODE_INVALID")),
  contact: z.string().trim().min(3, "ORDER_CONTACT_REQUIRED"),
});
export type LookupFormInput = z.input<typeof lookupSchema>;
export type LookupFormData = z.output<typeof lookupSchema>;

/** Sửa địa chỉ giao hàng sau khi xác minh OTP */
export const addressSchema = z.object({
  province: z.string().trim().min(1, "PROVINCE_NAME_REQUIRED"),
  district: z.string().trim().min(1, "DISTRICT_NAME_REQUIRED"),
  ward: z.string().trim().min(1, "WARD_NAME_REQUIRED"),
  addressLine: z.string().trim().min(1, "ADDRESS_LINE_REQUIRED"),
});
export type AddressFormData = z.infer<typeof addressSchema>;
