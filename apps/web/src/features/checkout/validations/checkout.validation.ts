import * as z from "zod";
import { emailSchema, vietnamPhoneSchema } from "@repo/shared";

/** Giới hạn ghi chú đơn hàng (ký tự) — đồng bộ maxLength của ô nhập */
export const ORDER_NOTES_MAX_LENGTH = 500;

/**
 * Bước 1 — thông tin giao hàng. Mã lỗi là KEY UPPER_SNAKE_CASE (dịch qua namespace `Errors`),
 * dùng chung validator `@repo/shared` để khớp Backend.
 * Ô SĐT dùng mask "0912 345 678" → bỏ khoảng trắng trước khi kiểm tra định dạng.
 */
export const shippingSchema = z.object({
  fullName: z.string().trim().min(1, "RECEIVER_NAME_REQUIRED"),
  phone: z
    .string()
    .trim()
    .min(1, "PHONE_REQUIRED")
    .transform((value) => value.replace(/\s+/g, ""))
    .pipe(vietnamPhoneSchema),
  email: z.string().trim().min(1, "EMAIL_REQUIRED").pipe(emailSchema),
  province: z.string().trim().min(1, "PROVINCE_NAME_REQUIRED"),
  district: z.string().trim().min(1, "DISTRICT_NAME_REQUIRED"),
  ward: z.string().trim().min(1, "WARD_NAME_REQUIRED"),
  address: z.string().trim().min(1, "ADDRESS_LINE_REQUIRED"),
  notes: z.string().trim().max(ORDER_NOTES_MAX_LENGTH),
});

export type ShippingFormInput = z.input<typeof shippingSchema>;
export type ShippingData = z.output<typeof shippingSchema>;
