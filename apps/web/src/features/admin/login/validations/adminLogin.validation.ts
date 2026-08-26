import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, "emailRequired")
    .email("invalidEmail"),
  password: z
    .string()
    .min(1, "passwordRequired")
    .min(6, "passwordMin"),
  rememberMe: z.boolean().default(true),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
