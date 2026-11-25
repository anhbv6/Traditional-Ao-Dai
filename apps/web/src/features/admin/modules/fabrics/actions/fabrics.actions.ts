"use server";

import { revalidatePath } from "next/cache";
import { type z } from "zod";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import {
  recordFabricMovementSchema,
  upsertFabricRollSchema,
  toggleFabricActiveSchema,
  toggleFabricProductVisibilitySchema,
} from "../schemas/fabrics.schemas";
import { applyMovement, roundMeters } from "../utils/fabricStock";

/**
 * Ghi nhận một biến động trên cây vải (cắt may, nhập thêm, hao hụt, kiểm kê)
 * và cập nhật số mét tồn kho tương ứng trong một transaction.
 */
export async function recordFabricMovementAction(raw: z.input<typeof recordFabricMovementSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;
  const input = parseActionInput(recordFabricMovementSchema, raw);
  if (!input.success) return input;
  const { fabricId, type, meters, orderCode, note } = input.data;

  try {
    const fabric = await prisma.fabric.findUnique({
      where: { id: fabricId },
      select: { id: true, name: true, code: true, remainingMeters: true, receivedMeters: true },
    });
    if (!fabric) {
      return { success: false as const, error: "FABRIC_NOT_FOUND" };
    }

    const currentRemaining = Number(fabric.remainingMeters);
    const balanceAfter = applyMovement(currentRemaining, type, meters);

    if (balanceAfter < 0) {
      return { success: false as const, error: "FABRIC_INSUFFICIENT_STOCK" };
    }

    const delta = roundMeters(balanceAfter - currentRemaining);
    const currentReceived = Number(fabric.receivedMeters ?? currentRemaining);
    const newReceived = type === "RESTOCK" ? Math.max(currentReceived, balanceAfter) : undefined;

    const [updatedFabric, movement] = await prisma.$transaction([
      prisma.fabric.update({
        where: { id: fabricId },
        data: {
          remainingMeters: balanceAfter,
          ...(newReceived !== undefined ? { receivedMeters: newReceived } : {}),
        },
        select: { id: true, remainingMeters: true, receivedMeters: true, updatedAt: true },
      }),
      prisma.fabricMovement.create({
        data: {
          fabricId,
          type,
          delta,
          balanceAfter,
          orderCode: orderCode || null,
          note: note || null,
          actorId: auth.user.id,
        },
        select: {
          id: true,
          type: true,
          delta: true,
          balanceAfter: true,
          orderCode: true,
          note: true,
          createdAt: true,
        },
      }),
    ]);

    await recordAudit({
      actorId: auth.user.id,
      action: `FABRIC_MOVEMENT_${type}`,
      targetType: "FABRIC",
      targetId: fabricId,
      metadata: {
        code: fabric.code,
        name: fabric.name,
        type,
        meters,
        delta,
        balanceAfter,
        orderCode: orderCode || null,
        note: note || null,
      },
    });

    revalidatePath("/admin/inventory/fabrics");
    revalidatePath("/admin/inventory/history");
    revalidatePath("/admin/catalog/materials");
    revalidatePath("/admin/dashboard");

    return {
      success: true as const,
      data: {
        fabric: {
          ...updatedFabric,
          remainingMeters: Number(updatedFabric.remainingMeters),
          receivedMeters: Number(updatedFabric.receivedMeters ?? updatedFabric.remainingMeters),
          updatedAt: updatedFabric.updatedAt.toISOString(),
        },
        movement: {
          ...movement,
          delta: Number(movement.delta),
          balanceAfter: Number(movement.balanceAfter),
          actorName: auth.user.name ?? "Quản trị viên",
          createdAt: movement.createdAt.toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("Lỗi recordFabricMovementAction:", error);
    return { success: false as const, error: "FABRIC_MOVEMENT_FAILED" };
  }
}

/**
 * Thêm mới hoặc chỉnh sửa thông tin cây vải.
 * Khi tạo mới, tự động tạo một biến động khởi đầu loại RESTOCK với số mét ban đầu.
 */
export async function upsertFabricRollAction(raw: z.input<typeof upsertFabricRollSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;
  const input = parseActionInput(upsertFabricRollSchema, raw);
  if (!input.success) return input;
  const { id, materialId, colorId, name, nameEn, code, receivedMeters, lowStockThreshold, productId } = input.data;

  try {
    // Lấy thông tin màu sắc (snapshot tên màu)
    const colorValue = colorId
      ? await prisma.attributeValue.findUnique({
          where: { id: colorId },
          select: { name: true },
        })
      : null;

    if (id) {
      // Kiểm tra trùng mã cây vải với cây khác
      const duplicate = await prisma.fabric.findFirst({
        where: { code, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        return { success: false as const, error: "FABRIC_CODE_ALREADY_EXISTS" };
      }

      const updated = await prisma.fabric.update({
        where: { id },
        data: {
          materialId,
          colorId: colorId || null,
          color: colorValue?.name ?? null,
          name,
          nameEn: nameEn || null,
          code,
          lowStockThreshold,
          productId: productId || null,
        },
      });

      await recordAudit({
        actorId: auth.user.id,
        action: "FABRIC_ROLL_UPDATED",
        targetType: "FABRIC",
        targetId: id,
        metadata: { code, name, nameEn, materialId, colorId },
      });

      revalidatePath("/admin/inventory/fabrics");
      revalidatePath("/admin/catalog/materials");

      return { success: true as const, data: { id: updated.id } };
    }

    // Tạo mới cây vải
    const existing = await prisma.fabric.findUnique({
      where: { code },
      select: { id: true },
    });
    if (existing) {
      return { success: false as const, error: "FABRIC_CODE_ALREADY_EXISTS" };
    }

    const created = await prisma.$transaction(async (tx) => {
      const roll = await tx.fabric.create({
        data: {
          materialId,
          colorId: colorId || null,
          color: colorValue?.name ?? null,
          name,
          nameEn: nameEn || null,
          code,
          receivedMeters,
          remainingMeters: receivedMeters,
          lowStockThreshold,
          productId: productId || null,
          isActive: true,
        },
      });

      await tx.fabricMovement.create({
        data: {
          fabricId: roll.id,
          type: "RESTOCK",
          delta: receivedMeters,
          balanceAfter: receivedMeters,
          note: "Nhập cây vải mới",
          actorId: auth.user.id,
        },
      });

      return roll;
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "FABRIC_ROLL_CREATED",
      targetType: "FABRIC",
      targetId: created.id,
      metadata: { code, name, receivedMeters, materialId },
    });

    revalidatePath("/admin/inventory/fabrics");
    revalidatePath("/admin/inventory/history");
    revalidatePath("/admin/catalog/materials");
    revalidatePath("/admin/dashboard");

    return { success: true as const, data: { id: created.id } };
  } catch (error) {
    console.error("Lỗi upsertFabricRollAction:", error);
    return { success: false as const, error: "FABRIC_ROLL_SAVE_FAILED" };
  }
}

/**
 * Đổi trạng thái hoạt động của cây vải (ngưng dùng / kích hoạt lại)
 */
export async function toggleFabricActiveAction(raw: z.input<typeof toggleFabricActiveSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;
  const input = parseActionInput(toggleFabricActiveSchema, raw);
  if (!input.success) return input;
  const { fabricId } = input.data;

  try {
    const current = await prisma.fabric.findUnique({
      where: { id: fabricId },
      select: { id: true, name: true, code: true, isActive: true },
    });
    if (!current) {
      return { success: false as const, error: "FABRIC_NOT_FOUND" };
    }

    const updated = await prisma.fabric.update({
      where: { id: fabricId },
      data: { isActive: !current.isActive },
      select: { id: true, isActive: true },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: updated.isActive ? "FABRIC_ACTIVATED" : "FABRIC_DEACTIVATED",
      targetType: "FABRIC",
      targetId: fabricId,
      metadata: { code: current.code, name: current.name, isActive: updated.isActive },
    });

    revalidatePath("/admin/inventory/fabrics");
    revalidatePath("/admin/catalog/materials");

    return { success: true as const, data: updated };
  } catch (error) {
    console.error("Lỗi toggleFabricActiveAction:", error);
    return { success: false as const, error: "FABRIC_TOGGLE_ACTIVE_FAILED" };
  }
}

/**
 * Ẩn / hiện nhanh sản phẩm may từ cây vải (khi cây vải hết hoặc nhập thêm)
 */
export async function toggleFabricProductVisibilityAction(raw: z.input<typeof toggleFabricProductVisibilitySchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;
  const input = parseActionInput(toggleFabricProductVisibilitySchema, raw);
  if (!input.success) return input;
  const { productId } = input.data;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, code: true, isActive: true },
    });
    if (!product) {
      return { success: false as const, error: "PRODUCT_NOT_FOUND" };
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isActive: !product.isActive },
      select: { id: true, isActive: true },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: updated.isActive ? "PRODUCT_SHOWN_FROM_FABRIC" : "PRODUCT_HIDDEN_FROM_FABRIC",
      targetType: "PRODUCT",
      targetId: productId,
      metadata: { code: product.code, name: product.name, isVisible: updated.isActive },
    });

    revalidatePath("/admin/inventory/fabrics");
    revalidatePath("/admin/products");

    return { success: true as const, data: updated };
  } catch (error) {
    console.error("Lỗi toggleFabricProductVisibilityAction:", error);
    return { success: false as const, error: "PRODUCT_VISIBILITY_FAILED" };
  }
}
