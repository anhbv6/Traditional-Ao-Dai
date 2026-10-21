import { z } from "zod";

export const toggleVoucherActiveSchema = z.object({ voucherId: z.uuid(), isActive: z.boolean() });
