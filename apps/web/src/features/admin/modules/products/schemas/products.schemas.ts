import { z } from "zod";

export const toggleProductActiveSchema = z.object({ productId: z.uuid(), isActive: z.boolean() });
export const toggleProductCustomFitSchema = z.object({ productId: z.uuid(), isCustomFit: z.boolean() });
