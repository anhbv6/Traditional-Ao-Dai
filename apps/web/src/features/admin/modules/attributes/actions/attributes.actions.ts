"use server";

import { type z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { getAdminAttributeDataQuery } from "../queries/attributes.queries";
import {
  attributeGroupIdSchema,
  attributeIdSchema,
  createAttributeGroupSchema,
  createAttributeSchema,
  reorderAttributesSchema,
  updateAttributeGroupSchema,
  updateAttributeSchema,
  type AttributeFormValues,
  type AttributeGroupFormValues,
} from "../schemas/attributes.schemas";

const ACCESS = ADMIN_MODULE_ACCESS.attributes;

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

function revalidateAttributes() {
  revalidatePath("/admin/catalog/attributes");
  // Form sản phẩm hiển thị đặc tính thiết kế theo nhóm
  revalidatePath("/admin/products");
}

/** Dữ liệu ghi Prisma của một giá trị — mã màu / họ màu chỉ có nghĩa với nhóm màu */
function toAttributeData(values: Omit<AttributeFormValues, "groupId">, groupCode: string) {
  const isColor = groupCode === "COLOR";
  return {
    code: values.code,
    name: values.name,
    nameEn: values.nameEn || null,
    description: values.description || null,
    descriptionEn: values.descriptionEn || null,
    hex: isColor ? values.hex : null,
    family: isColor ? values.family || null : null,
    isActive: values.isActive,
  };
}

/** Màu bắt buộc có mã hex để hiện ô màu trên cửa hàng */
const missingHex = (groupCode: string, hex: string) => groupCode === "COLOR" && hex === "";

/** Server Action: thêm giá trị thuộc tính, xếp cuối nhóm */
export async function createAttributeAction(raw: z.input<typeof createAttributeSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(createAttributeSchema, raw);
  if (!input.success) return input;
  const { groupId, ...values } = input.data;

  try {
    const group = await prisma.attributeGroup.findUnique({ where: { id: groupId }, select: { code: true } });
    if (!group) return { success: false as const, error: "ATTRIBUTE_GROUP_NOT_FOUND" };
    if (missingHex(group.code, values.hex)) return { success: false as const, error: "ATTRIBUTE_HEX_INVALID" };

    const last = await prisma.attributeValue.findFirst({
      where: { groupId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const created = await prisma.attributeValue.create({
      data: { ...toAttributeData(values, group.code), groupId, position: (last?.position ?? -1) + 1 },
      select: { id: true },
    });
    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_CREATED",
      targetType: "ATTRIBUTE",
      targetId: created.id,
      metadata: { group: group.code, code: values.code },
    });
    revalidateAttributes();
    return { success: true as const, data: await getAdminAttributeDataQuery() };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "ATTRIBUTE_CODE_TAKEN" };
    console.error("Lỗi createAttributeAction:", error);
    return { success: false as const, error: "ATTRIBUTE_CREATE_FAILED" };
  }
}

/** Server Action: sửa giá trị thuộc tính (không đổi được nhóm) */
export async function updateAttributeAction(raw: z.input<typeof updateAttributeSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(updateAttributeSchema, raw);
  if (!input.success) return input;
  const { attributeId, groupId, ...values } = input.data;

  try {
    const existing = await prisma.attributeValue.findUnique({
      where: { id: attributeId },
      select: { groupId: true, group: { select: { code: true } } },
    });
    if (!existing) return { success: false as const, error: "ATTRIBUTE_NOT_FOUND" };
    if (existing.groupId !== groupId) return { success: false as const, error: "VALIDATION_ERROR" };
    if (missingHex(existing.group.code, values.hex)) return { success: false as const, error: "ATTRIBUTE_HEX_INVALID" };

    await prisma.attributeValue.update({
      where: { id: attributeId },
      data: toAttributeData(values, existing.group.code),
    });
    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_UPDATED",
      targetType: "ATTRIBUTE",
      targetId: attributeId,
      metadata: { group: existing.group.code, code: values.code, isActive: values.isActive },
    });
    revalidateAttributes();
    return { success: true as const, data: await getAdminAttributeDataQuery() };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "ATTRIBUTE_CODE_TAKEN" };
    console.error("Lỗi updateAttributeAction:", error);
    return { success: false as const, error: "ATTRIBUTE_UPDATE_FAILED" };
  }
}

/** Server Action: lưu thứ tự hiển thị trong một nhóm */
export async function reorderAttributesAction(raw: z.input<typeof reorderAttributesSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(reorderAttributesSchema, raw);
  if (!input.success) return input;
  const { groupId, orderedIds } = input.data;

  try {
    const count = await prisma.attributeValue.count({ where: { groupId, id: { in: orderedIds } } });
    if (count !== orderedIds.length) return { success: false as const, error: "ATTRIBUTE_NOT_FOUND" };
    await prisma.$transaction(
      orderedIds.map((id, position) => prisma.attributeValue.update({ where: { id }, data: { position } }))
    );
    revalidateAttributes();
    return { success: true as const, data: { groupId } };
  } catch (error) {
    console.error("Lỗi reorderAttributesAction:", error);
    return { success: false as const, error: "ATTRIBUTE_UPDATE_FAILED" };
  }
}

/** Server Action: xóa giá trị — màu / size đang có SKU dùng thì chỉ được ẩn */
export async function deleteAttributeAction(raw: z.input<typeof attributeIdSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(attributeIdSchema, raw);
  if (!input.success) return input;
  const { attributeId } = input.data;

  try {
    const existing = await prisma.attributeValue.findUnique({
      where: { id: attributeId },
      include: { group: { select: { code: true } } },
    });
    if (!existing) return { success: false as const, error: "ATTRIBUTE_NOT_FOUND" };
    const inUse =
      existing.group.code === "COLOR"
        ? await prisma.productVariant.count({ where: { color: { equals: existing.name, mode: "insensitive" } } })
        : existing.group.code === "SIZE"
          ? await prisma.productVariant.count({ where: { size: existing.code } })
          : 0;
    if (inUse > 0) return { success: false as const, error: "ATTRIBUTE_IN_USE" };

    await prisma.attributeValue.delete({ where: { id: attributeId } });
    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_DELETED",
      targetType: "ATTRIBUTE",
      targetId: attributeId,
      metadata: { group: existing.group.code, code: existing.code, name: existing.name },
    });
    revalidateAttributes();
    return { success: true as const, data: await getAdminAttributeDataQuery() };
  } catch (error) {
    console.error("Lỗi deleteAttributeAction:", error);
    return { success: false as const, error: "ATTRIBUTE_DELETE_FAILED" };
  }
}

function toGroupData(values: AttributeGroupFormValues) {
  return {
    name: values.name,
    nameEn: values.nameEn || null,
    description: values.description || null,
    descriptionEn: values.descriptionEn || null,
  };
}

/** Server Action: thêm nhóm thuộc tính (thuộc tính cha) mới — luôn là đặc tính thiết kế, xếp cuối danh sách */
export async function createAttributeGroupAction(raw: z.input<typeof createAttributeGroupSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(createAttributeGroupSchema, raw);
  if (!input.success) return input;
  const values = input.data;

  try {
    const last = await prisma.attributeGroup.findFirst({ orderBy: { position: "desc" }, select: { position: true } });
    const created = await prisma.attributeGroup.create({
      data: { ...toGroupData(values), code: values.code, isSystem: false, position: (last?.position ?? -1) + 1 },
      select: { id: true },
    });
    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_GROUP_CREATED",
      targetType: "ATTRIBUTE_GROUP",
      targetId: created.id,
      metadata: { code: values.code, name: values.name },
    });
    revalidateAttributes();
    return { success: true as const, data: { id: created.id, ...(await getAdminAttributeDataQuery()) } };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "ATTRIBUTE_GROUP_CODE_TAKEN" };
    console.error("Lỗi createAttributeGroupAction:", error);
    return { success: false as const, error: "ATTRIBUTE_GROUP_CREATE_FAILED" };
  }
}

/** Server Action: sửa tên / mô tả nhóm. Mã nhóm hệ thống cố định (màu, size, đặc tính có sẵn dựa vào mã) */
export async function updateAttributeGroupAction(raw: z.input<typeof updateAttributeGroupSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(updateAttributeGroupSchema, raw);
  if (!input.success) return input;
  const { groupId, ...values } = input.data;

  try {
    const existing = await prisma.attributeGroup.findUnique({ where: { id: groupId }, select: { isSystem: true } });
    if (!existing) return { success: false as const, error: "ATTRIBUTE_GROUP_NOT_FOUND" };

    await prisma.attributeGroup.update({
      where: { id: groupId },
      data: { ...toGroupData(values), ...(existing.isSystem ? {} : { code: values.code }) },
    });
    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_GROUP_UPDATED",
      targetType: "ATTRIBUTE_GROUP",
      targetId: groupId,
      metadata: { name: values.name },
    });
    revalidateAttributes();
    return { success: true as const, data: await getAdminAttributeDataQuery() };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "ATTRIBUTE_GROUP_CODE_TAKEN" };
    console.error("Lỗi updateAttributeGroupAction:", error);
    return { success: false as const, error: "ATTRIBUTE_GROUP_UPDATE_FAILED" };
  }
}

/** Server Action: xóa nhóm do admin thêm — nhóm hệ thống không xóa được, nhóm còn giá trị thì phải xóa giá trị trước */
export async function deleteAttributeGroupAction(raw: z.input<typeof attributeGroupIdSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(attributeGroupIdSchema, raw);
  if (!input.success) return input;
  const { groupId } = input.data;

  try {
    const existing = await prisma.attributeGroup.findUnique({
      where: { id: groupId },
      select: { code: true, name: true, isSystem: true, _count: { select: { values: true } } },
    });
    if (!existing) return { success: false as const, error: "ATTRIBUTE_GROUP_NOT_FOUND" };
    if (existing.isSystem) return { success: false as const, error: "ATTRIBUTE_GROUP_SYSTEM_LOCKED" };
    if (existing._count.values > 0) return { success: false as const, error: "ATTRIBUTE_GROUP_NOT_EMPTY" };

    await prisma.attributeGroup.delete({ where: { id: groupId } });
    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_GROUP_DELETED",
      targetType: "ATTRIBUTE_GROUP",
      targetId: groupId,
      metadata: { code: existing.code, name: existing.name },
    });
    revalidateAttributes();
    return { success: true as const, data: await getAdminAttributeDataQuery() };
  } catch (error) {
    console.error("Lỗi deleteAttributeGroupAction:", error);
    return { success: false as const, error: "ATTRIBUTE_GROUP_DELETE_FAILED" };
  }
}
