import { z } from "zod";
import { ATTRIBUTE_GROUPS, COLOR_FAMILIES } from "../utils/attributeMeta";

const attributeFields = z
  .object({
    group: z.enum(ATTRIBUTE_GROUPS),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]+([-_][A-Z0-9]+)*$/, "ATTRIBUTE_CODE_INVALID")
      .max(40),
    name: z.string().trim().min(1, "ATTRIBUTE_NAME_REQUIRED").max(80),
    nameEn: z.string().trim().max(80),
    description: z.string().trim().max(300),
    descriptionEn: z.string().trim().max(300),
    hex: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^(#[0-9A-F]{6})?$/, "ATTRIBUTE_HEX_INVALID"),
    family: z.enum(COLOR_FAMILIES).or(z.literal("")),
    isActive: z.boolean(),
  })
  // Màu bắt buộc có mã hex để hiện ô màu trên cửa hàng
  .refine((value) => value.group !== "COLOR" || value.hex !== "", { message: "ATTRIBUTE_HEX_INVALID", path: ["hex"] });

export const createAttributeSchema = attributeFields;
export const updateAttributeSchema = attributeFields.and(z.object({ attributeId: z.uuid() }));
export const attributeIdSchema = z.object({ attributeId: z.uuid() });
export const reorderAttributesSchema = z.object({
  group: z.enum(ATTRIBUTE_GROUPS),
  orderedIds: z.array(z.uuid()).min(1).max(300),
});

export type AttributeFormValues = z.infer<typeof attributeFields>;
