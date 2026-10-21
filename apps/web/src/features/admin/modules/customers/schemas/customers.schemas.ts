import { z } from "zod";

export const toggleCustomerActiveSchema = z.object({ userId: z.uuid(), isActive: z.boolean() });
