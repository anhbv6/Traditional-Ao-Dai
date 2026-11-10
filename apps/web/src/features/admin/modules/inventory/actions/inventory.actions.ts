"use server";

import { revalidatePath } from "next/cache";
import { type z } from "zod";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { adjustProductStockSchema } from "../schemas/inventory.schemas";

/**
 * Điều chỉnh tồn các SKU của một sản phẩm (nhập hàng, kiểm kê, bán tại tiệm...) — một transaction,
 * chỉ nhận SKU thuộc đúng sản phẩm, ghi AuditLog kèm lý do và từng thay đổi trước → sau.
 */
export async function adjustProductStockAction(raw: z.input<typeof adjustProductStockSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;
  const input = parseActionInput(adjustProductStockSchema, raw);
  if (!input.success) return input;
  const { productId, reason, note, changes } = input.data;

  try {
    const variants = await prisma.productVariant.findMany({
      where: { productId, id: { in: changes.map((change) => change.variantId) } },
      select: { id: true, sku: true, stock: true },
    });
    if (variants.length !== new Set(changes.map((change) => change.variantId)).size) {
      return { success: false as const, error: "INVENTORY_VARIANT_NOT_FOUND" };
    }

    const before = new Map(variants.map((variant) => [variant.id, variant]));
    const effective = changes.filter((change) => before.get(change.variantId)?.stock !== change.stock);

    const updated = await prisma.$transaction(
      effective.map((change) =>
        prisma.productVariant.update({
          where: { id: change.variantId },
          data: { stock: change.stock },
          select: { id: true, stock: true, updatedAt: true },
        })
      )
    );

    if (effective.length > 0) {
      await recordAudit({
        actorId: auth.user.id,
        action: "INVENTORY_ADJUSTED",
        targetType: "PRODUCT",
        targetId: productId,
        metadata: {
          reason,
          note: note || null,
          changes: effective.map((change) => ({
            sku: before.get(change.variantId)?.sku ?? change.variantId,
            from: before.get(change.variantId)?.stock ?? 0,
            to: change.stock,
          })),
        },
      });
    }

    revalidatePath("/admin/inventory/skus");
    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");

    return {
      success: true as const,
      data: updated.map((variant) => ({ ...variant, updatedAt: variant.updatedAt.toISOString() })),
    };
  } catch (error) {
    console.error("Lỗi adjustProductStockAction:", error);
    return { success: false as const, error: "INVENTORY_UPDATE_FAILED" };
  }
}
