import { z } from "zod";
import { COLOR_FAMILIES } from "../utils/attributeMeta";

/** Mã chữ in hoa: chữ số, nối bằng - hoặc _ (VD "DO-DO", "PATTERN_TECHNIQUE") */
const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]+([-_][A-Z0-9]+)*$/, "ATTRIBUTE_CODE_INVALID")
  .max(40);

// Màu bắt buộc có mã hex — kiểm tra ở server vì cần biết mã của nhóm (groupId từ client)
const attributeFields = z.object({
  groupId: z.uuid(),
  code: codeSchema,
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
});

export const createAttributeSchema = attributeFields;
export const updateAttributeSchema = attributeFields.extend({ attributeId: z.uuid() });
export const attributeIdSchema = z.object({ attributeId: z.uuid() });
export const reorderAttributesSchema = z.object({
  groupId: z.uuid(),
  orderedIds: z.array(z.uuid()).min(1).max(300),
});

/** Nhóm thuộc tính (thuộc tính cha) — nhóm mới luôn là đặc tính thiết kế */
const attributeGroupFields = z.object({
  code: codeSchema,
  name: z.string().trim().min(1, "ATTRIBUTE_GROUP_NAME_REQUIRED").max(60),
  nameEn: z.string().trim().max(60),
  description: z.string().trim().max(300),
  descriptionEn: z.string().trim().max(300),
});

export const createAttributeGroupSchema = attributeGroupFields;
export const updateAttributeGroupSchema = attributeGroupFields.extend({ groupId: z.uuid() });
export const attributeGroupIdSchema = z.object({ groupId: z.uuid() });

export type AttributeFormValues = z.infer<typeof attributeFields>;
export type AttributeGroupFormValues = z.infer<typeof attributeGroupFields>;
