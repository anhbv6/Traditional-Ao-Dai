import { z } from "zod";
import { PERMISSIONS } from "@repo/shared";
import { emailSchema, newPasswordSchema, vietnamPhoneSchema } from "@repo/shared/validation";

/** Mảng quyền không trùng lặp (thứ tự không quan trọng) */
const permissionsSchema = z
  .array(z.enum(PERMISSIONS))
  .transform((items) => Array.from(new Set(items)));

export const updateStaffPermissionSchema = z.object({ userId: z.uuid(), permissions: permissionsSchema });
export const toggleStaffActiveSchema = z.object({ userId: z.uuid(), isActive: z.boolean() });
export const resetStaffPasswordSchema = z.object({ userId: z.uuid(), newPassword: newPasswordSchema });

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "NAME_MIN_LENGTH"),
  email: emailSchema,
  phone: vietnamPhoneSchema.optional().or(z.literal("")),
  password: newPasswordSchema,
  permissions: permissionsSchema,
});
