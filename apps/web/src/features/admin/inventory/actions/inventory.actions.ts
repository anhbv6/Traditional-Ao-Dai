"use server";

import { prisma } from "../../server/db.server";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Cập nhật nhanh số lượng tồn kho biến thể SKU
 */
export async function updateVariantStockAction(variantId: string, stock: number) {
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
  } catch (error: any) {
    console.error("Lỗi updateVariantStockAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật tồn kho biến thể.",
    };
  }
}
