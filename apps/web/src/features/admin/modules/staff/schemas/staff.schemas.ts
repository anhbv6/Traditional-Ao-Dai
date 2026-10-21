import { z } from "zod";
import { emailSchema, newPasswordSchema, vietnamPhoneSchema } from "@repo/shared/validation";

const staffPermissionsSchema = z.object({
  canManageOrders: z.boolean(),
  canUpdateTailoring: z.boolean(),
  canManageInventory: z.boolean(),
  canViewReports: z.boolean(),
  canManageContent: z.boolean(),
});

export const updateStaffPermissionSchema = z.object({ userId: z.uuid(), permissions: staffPermissionsSchema });
export const toggleStaffActiveSchema = z.object({ userId: z.uuid(), isActive: z.boolean() });

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "NAME_MIN_LENGTH"),
  email: emailSchema,
  phone: vietnamPhoneSchema.optional().or(z.literal("")),
  password: newPasswordSchema,
  permissions: staffPermissionsSchema,
});
