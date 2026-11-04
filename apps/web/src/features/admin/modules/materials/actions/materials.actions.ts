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
  createMaterialSchema,
  materialIdSchema,
  updateMaterialSchema,
  type MaterialFormValues,
} from "../schemas/materials.schemas";

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
