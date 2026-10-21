import type { z } from "zod";

const KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export type ActionInputError = { success: false; error: string };

/**
 * Kiểm tra lại tham số của Server Action bằng Zod.
 * Server Action là endpoint công khai — kiểu TypeScript chỉ tồn tại lúc build, client có thể gửi bất kỳ giá trị nào.
 * Gọi NGAY SAU `authorizeAdminAction` (trừ khi quyền phụ thuộc vào chính tham số, vd. cột Kanban).
 *
 * Lỗi trả về là mã KEY: thông điệp của issue đầu tiên nếu schema khai báo mã riêng (vd. "NAME_MIN_LENGTH"),
 * ngược lại là "VALIDATION_ERROR". Client hiển thị bằng `useNotify().error(res.error, ...)`.
 *
 * @example
 * const input = parseActionInput(updateOrderStatusSchema, { orderId, status });
 * if (!input.success) return input;
 */
export function parseActionInput<S extends z.ZodType>(
  schema: S,
  raw: unknown
): { success: true; data: z.output<S> } | ActionInputError {
  const result = schema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };

  const message = result.error.issues[0]?.message;
  return { success: false, error: message && KEY_PATTERN.test(message) ? message : "VALIDATION_ERROR" };
}
