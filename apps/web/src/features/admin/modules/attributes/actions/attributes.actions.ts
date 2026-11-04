"use server";

import { type z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { getAdminAttributesQuery } from "../queries/attributes.queries";
import {
  attributeIdSchema,
  createAttributeSchema,
  reorderAttributesSchema,
  updateAttributeSchema,
  type AttributeFormValues,
} from "../schemas/attributes.schemas";

const ACCESS = ADMIN_MODULE_ACCESS.attributes;

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

function toAttributeData(values: AttributeFormValues) {
  const isColor = values.group === "COLOR";
  return {
    group: values.group,
    code: values.code,
    name: values.name,
    nameEn: values.nameEn || null,
    description: values.description || null,
    descriptionEn: values.descriptionEn || null,
    // Mã màu / họ màu chỉ có nghĩa với nhóm màu
    hex: isColor ? values.hex : null,
    family: isColor ? values.family || null : null,
    isActive: values.isActive,
  };
}

/** Server Action: thêm giá trị thuộc tính, xếp cuối nhóm */
export async function createAttributeAction(raw: z.input<typeof createAttributeSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(createAttributeSchema, raw);
  if (!input.success) return input;
  const values = input.data;

  try {
    const last = await prisma.attributeValue.findFirst({
      where: { group: values.group },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const created = await prisma.attributeValue.create({
      data: { ...toAttributeData(values), position: (last?.position ?? -1) + 1 },
      select: { id: true },
    });
    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_CREATED",
      targetType: "ATTRIBUTE",
      targetId: created.id,
      metadata: { group: values.group, code: values.code },
    });
    revalidatePath("/admin/catalog/attributes");
    return { success: true as const, data: { values: await getAdminAttributesQuery() } };
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
  const { attributeId, ...values } = input.data;

  try {
    const existing = await prisma.attributeValue.findUnique({ where: { id: attributeId }, select: { group: true } });
    if (!existing) return { success: false as const, error: "ATTRIBUTE_NOT_FOUND" };
    if (existing.group !== values.group) return { success: false as const, error: "VALIDATION_ERROR" };

    await prisma.attributeValue.update({ where: { id: attributeId }, data: toAttributeData(values) });
    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_UPDATED",
      targetType: "ATTRIBUTE",
      targetId: attributeId,
      metadata: { group: values.group, code: values.code, isActive: values.isActive },
    });
    revalidatePath("/admin/catalog/attributes");
    return { success: true as const, data: { values: await getAdminAttributesQuery() } };
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
  const { group, orderedIds } = input.data;

  try {
    const count = await prisma.attributeValue.count({ where: { group, id: { in: orderedIds } } });
    if (count !== orderedIds.length) return { success: false as const, error: "ATTRIBUTE_NOT_FOUND" };
    await prisma.$transaction(
      orderedIds.map((id, position) => prisma.attributeValue.update({ where: { id }, data: { position } }))
    );
    revalidatePath("/admin/catalog/attributes");
    return { success: true as const, data: { group } };
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
    const existing = await prisma.attributeValue.findUnique({ where: { id: attributeId } });
    if (!existing) return { success: false as const, error: "ATTRIBUTE_NOT_FOUND" };
    const inUse =
      existing.group === "COLOR"
        ? await prisma.productVariant.count({ where: { color: { equals: existing.name, mode: "insensitive" } } })
        : existing.group === "SIZE"
          ? await prisma.productVariant.count({ where: { size: existing.code } })
          : 0;
    if (inUse > 0) return { success: false as const, error: "ATTRIBUTE_IN_USE" };

    await prisma.attributeValue.delete({ where: { id: attributeId } });
    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_DELETED",
      targetType: "ATTRIBUTE",
      targetId: attributeId,
      metadata: { group: existing.group, code: existing.code, name: existing.name },
    });
    revalidatePath("/admin/catalog/attributes");
    return { success: true as const, data: { values: await getAdminAttributesQuery() } };
  } catch (error) {
    console.error("Lỗi deleteAttributeAction:", error);
    return { success: false as const, error: "ATTRIBUTE_DELETE_FAILED" };
  }
}
