import { z } from "zod";
import { FABRIC_MOVEMENT_TYPES } from "../types/fabrics.types";

export const recordFabricMovementSchema = z.object({
  fabricId: z.string().uuid(),
  type: z.enum(FABRIC_MOVEMENT_TYPES),
  /** CUT / RESTOCK / WASTE: số mét thay đổi (> 0); ADJUST: số mét đo thực tế (>= 0) */
  meters: z.number().min(0).max(10_000),
  orderCode: z.string().trim().max(50).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

export const upsertFabricRollSchema = z.object({
  id: z.string().uuid().optional(),
  materialId: z.string().uuid(),
  colorId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1, "FABRIC_NAME_REQUIRED").max(100),
  nameEn: z.string().trim().max(100).nullable().optional(),
  code: z.string().trim().min(1, "FABRIC_CODE_REQUIRED").max(50),
  receivedMeters: z.number().positive("FABRIC_METERS_POSITIVE").max(10_000),
  lowStockThreshold: z.number().min(0).max(100),
  productId: z.string().uuid().nullable().optional(),
});

export const toggleFabricActiveSchema = z.object({
  fabricId: z.string().uuid(),
});

export const toggleFabricProductVisibilitySchema = z.object({
  productId: z.string().uuid(),
});
