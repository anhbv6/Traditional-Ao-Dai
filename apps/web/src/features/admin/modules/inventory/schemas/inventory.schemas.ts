import { z } from "zod";

/** Tồn kho là số nguyên không âm; chặn trên để tránh nhập nhầm số quá lớn */
export const updateVariantStockSchema = z.object({
  variantId: z.uuid(),
  stock: z.number().int().min(0).max(1_000_000),
});
