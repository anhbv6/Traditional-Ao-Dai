import { z } from "zod";
import { STOCK_ADJUST_REASONS } from "../types/inventory.types";

/**
 * Điều chỉnh tồn nhiều SKU của MỘT sản phẩm trong một lần lưu (ma trận màu × size).
 * Tồn là số nguyên không âm; chặn trên để tránh gõ nhầm số quá lớn.
 */
export const adjustProductStockSchema = z.object({
  productId: z.uuid(),
  reason: z.enum(STOCK_ADJUST_REASONS),
  note: z.string().trim().max(200).optional(),
  changes: z
    .array(z.object({ variantId: z.uuid(), stock: z.number().int().min(0).max(100_000) }))
    .min(1)
    .max(200),
});
