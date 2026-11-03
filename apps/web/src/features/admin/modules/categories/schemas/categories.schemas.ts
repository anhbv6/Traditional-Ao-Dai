import { z } from "zod";
import { PRODUCT_GROUPS } from "@repo/shared/sizing";

const categoryFields = z.object({
  name: z.string().trim().min(1, "CATEGORY_NAME_REQUIRED").max(120),
  nameEn: z.string().trim().max(120),
  slug: z
    .string()
    .trim()
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "CATEGORY_SLUG_INVALID")
    .max(120),
  description: z.string().trim().max(1000),
  descriptionEn: z.string().trim().max(1000),
  group: z.enum(PRODUCT_GROUPS),
  isActive: z.boolean(),
  defaultSizeChartId: z.uuid().or(z.literal("")),
  /** null = nhóm gốc */
  parentId: z.uuid().nullable(),
});

export const createCategorySchema = categoryFields;
export const updateCategorySchema = categoryFields.extend({ categoryId: z.uuid() });

export const reorderCategoriesSchema = z.object({
  parentId: z.uuid().nullable(),
  orderedIds: z.array(z.uuid()).min(1).max(200),
});

export const categoryIdSchema = z.object({ categoryId: z.uuid() });

export type CategoryFormValues = z.infer<typeof categoryFields>;
