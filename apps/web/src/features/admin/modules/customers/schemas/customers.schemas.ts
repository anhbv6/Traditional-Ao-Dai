import { z } from "zod";

/** Khóa cần lý do (lưu `lockedReason`, hiện cho nhân viên khác); mở khóa thì bỏ qua */
export const toggleCustomerActiveSchema = z.object({
  userId: z.uuid(),
  isActive: z.boolean(),
  reason: z.string().trim().max(300).optional(),
});
