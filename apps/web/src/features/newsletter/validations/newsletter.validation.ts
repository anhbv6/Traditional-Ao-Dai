import * as z from "zod";
import { emailSchema } from "@repo/shared";

/**
 * Form đăng ký Newsletter / VIP Club — chỉ thu EMAIL (kênh gửi BST mới & mã giảm giá).
 * Không thu SĐT: tránh nghĩa vụ đồng ý riêng cho SMS/cuộc gọi quảng cáo và tăng tỉ lệ đăng ký.
 * Mã lỗi là KEY UPPER_SNAKE_CASE, dịch qua namespace `Errors`.
 */
export const newsletterSchema = z.object({
  email: z.string().trim().min(1, "EMAIL_REQUIRED").pipe(emailSchema),
});

export type NewsletterFormInput = z.input<typeof newsletterSchema>;
export type NewsletterPayload = z.output<typeof newsletterSchema>;
