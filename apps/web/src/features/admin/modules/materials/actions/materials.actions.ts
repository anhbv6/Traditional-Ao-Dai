"use server";

import { type z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { getAdminMaterialDetailQuery } from "../queries/materials.queries";
import {
  createMaterialColorSchema,
  createMaterialSchema,
  materialIdSchema,
  updateMaterialSchema,
  type MaterialFormValues,
} from "../schemas/materials.schemas";
import { toSlug } from "@/features/admin/modules/products";

const ACCESS = ADMIN_MODULE_ACCESS.materials;

function revalidateMaterials(id?: string) {
  revalidatePath("/admin/catalog/materials");
  if (id) revalidatePath(`/admin/catalog/materials/${id}`);
}

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

function toMaterialData(values: MaterialFormValues) {
  const decimal = (value: number | null) => (value === null ? null : new Prisma.Decimal(value));
  return {
    code: values.code,
    name: values.name,
    nameEn: values.nameEn || null,
    origin: values.origin || null,
    originEn: values.originEn || null,
    description: values.description || null,
    descriptionEn: values.descriptionEn || null,
    colorIds: values.colorIds,
    composition: values.composition,
    processSteps: values.processSteps,
    closeupImages: values.closeupImages,
    videoUrl: values.videoUrl || null,
    ...values.metrics,
    seasons: values.seasons,
    careCodes: values.careCodes,
    careNote: values.careNote || null,
    careNoteEn: values.careNoteEn || null,
    widthCm: values.widthCm,
    metersPerTop: decimal(values.metersPerTop),
    metersPerPants: decimal(values.metersPerPants),
    isActive: values.isActive,
  };
}

/**
 * Server Action: tạo nhanh chất liệu (mã + tên), xếp cuối danh sách — các thông tin còn lại nhập ở màn chi tiết
 */
export async function createMaterialAction(raw: z.input<typeof createMaterialSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(createMaterialSchema, raw);
  if (!input.success) return input;

  try {
    const last = await prisma.material.findFirst({ orderBy: { position: "desc" }, select: { position: true } });
    const created = await prisma.material.create({
      data: { ...input.data, position: (last?.position ?? -1) + 1 },
      select: { id: true },
    });
    await recordAudit({
      actorId: auth.user.id,
      action: "MATERIAL_CREATED",
      targetType: "MATERIAL",
      targetId: created.id,
      metadata: { code: input.data.code, name: input.data.name },
    });
    revalidateMaterials();
    return { success: true as const, data: { id: created.id } };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "MATERIAL_CODE_TAKEN" };
    console.error("Lỗi createMaterialAction:", error);
    return { success: false as const, error: "MATERIAL_CREATE_FAILED" };
  }
}

/** Server Action: lưu toàn bộ thông tin chất liệu từ màn chi tiết */
export async function updateMaterialAction(raw: z.input<typeof updateMaterialSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(updateMaterialSchema, raw);
  if (!input.success) return input;
  const { materialId, ...values } = input.data;

  try {
    const existing = await prisma.material.findUnique({ where: { id: materialId }, select: { id: true } });
    if (!existing) return { success: false as const, error: "MATERIAL_NOT_FOUND" };

    await prisma.material.update({ where: { id: materialId }, data: toMaterialData(values) });
    await recordAudit({
      actorId: auth.user.id,
      action: "MATERIAL_UPDATED",
      targetType: "MATERIAL",
      targetId: materialId,
      metadata: { code: values.code, isActive: values.isActive },
    });
    revalidateMaterials(materialId);

    const detail = await getAdminMaterialDetailQuery(materialId);
    if (!detail) return { success: false as const, error: "MATERIAL_NOT_FOUND" };
    return { success: true as const, data: detail };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "MATERIAL_CODE_TAKEN" };
    console.error("Lỗi updateMaterialAction:", error);
    return { success: false as const, error: "MATERIAL_UPDATE_FAILED" };
  }
}

/** Server Action: xóa chất liệu — chỉ khi chưa có cây vải nào trong kho gắn với nó */
export async function deleteMaterialAction(raw: z.input<typeof materialIdSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(materialIdSchema, raw);
  if (!input.success) return input;
  const { materialId } = input.data;

  try {
    const existing = await prisma.material.findUnique({
      where: { id: materialId },
      select: { code: true, name: true, _count: { select: { fabrics: true } } },
    });
    if (!existing) return { success: false as const, error: "MATERIAL_NOT_FOUND" };
    if (existing._count.fabrics > 0) return { success: false as const, error: "MATERIAL_IN_USE" };

    await prisma.material.delete({ where: { id: materialId } });
    await recordAudit({
      actorId: auth.user.id,
      action: "MATERIAL_DELETED",
      targetType: "MATERIAL",
      targetId: materialId,
      metadata: { code: existing.code, name: existing.name },
    });
    revalidateMaterials();
    return { success: true as const, data: { id: materialId } };
  } catch (error) {
    console.error("Lỗi deleteMaterialAction:", error);
    return { success: false as const, error: "MATERIAL_DELETE_FAILED" };
  }
}

/**
 * Server Action: Thêm màu mới vào hệ thống (nhóm COLOR của Attributes) để gắn ngay cho chất liệu.
 * Đảm bảo đồng bộ 100% với phân hệ Thuộc tính sản phẩm (code, family, audit, revalidation).
 */
export async function createMaterialColorAction(raw: z.input<typeof createMaterialColorSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(createMaterialColorSchema, raw);
  if (!input.success) return input;

  const { name, nameEn, description, descriptionEn, hex, family } = input.data;

  const colorGroup = await prisma.attributeGroup.findUnique({
    where: { code: "COLOR" },
  });
  if (!colorGroup) {
    return { success: false as const, error: "COLOR_GROUP_NOT_FOUND" };
  }

  const effectiveCode =
    input.data.code?.trim().toUpperCase() ||
    toSlug(name).toUpperCase().replace(/[^A-Z0-9_-]/g, "") ||
    "COLOR-" + Date.now();

  try {
    const last = await prisma.attributeValue.findFirst({
      where: { groupId: colorGroup.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const color = await prisma.attributeValue.create({
      data: {
        groupId: colorGroup.id,
        code: effectiveCode,
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        description: description?.trim() || null,
        descriptionEn: descriptionEn?.trim() || null,
        hex: hex.toUpperCase(),
        family: family?.trim() || null,
        isActive: true,
        position: (last?.position ?? -1) + 1,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        hex: true,
      },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "ATTRIBUTE_CREATED",
      targetType: "ATTRIBUTE",
      targetId: color.id,
      metadata: { group: "COLOR", code: effectiveCode },
    });

    revalidatePath("/admin/catalog/materials");
    revalidatePath("/admin/catalog/attributes");

    return {
      success: true as const,
      data: {
        id: color.id,
        name: color.name,
        nameEn: color.nameEn,
        hex: color.hex ?? hex,
      },
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false as const, error: "ATTRIBUTE_CODE_TAKEN" };
    }
    console.error("Lỗi createMaterialColorAction:", error);
    return { success: false as const, error: "ATTRIBUTE_CREATE_FAILED" };
  }
}
