"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { revalidatePath } from "next/cache";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { updateVariantStockSchema } from "../schemas/inventory.schemas";

/**
 * Server Action: Cập nhật nhanh số lượng tồn kho biến thể SKU
 */
export async function updateVariantStockAction(variantId: string, stock: number) {
  const auth = await authorizeAdminAction({ permission: "canManageInventory" });
  if (!auth.success) return auth;

  const input = parseActionInput(updateVariantStockSchema, { variantId, stock });
  if (!input.success) return input;

  try {
    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: Math.max(0, stock) },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi updateVariantStockAction:", error);
    return {
      success: false,
      error: "INVENTORY_UPDATE_FAILED",
    };
  }
}
