"use server";

import { prisma } from "../../server/db.server";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Bật/Tắt trạng thái hoạt động của sản phẩm
 */
export async function toggleProductActiveAction(productId: string, isActive: boolean) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isActive },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    console.error("Lỗi toggleProductActiveAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật trạng thái sản phẩm.",
    };
  }
}

/**
 * Server Action: Bật/Tắt tính năng may đo riêng (Custom Fit)
 */
export async function toggleProductCustomFitAction(productId: string, isCustomFit: boolean) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isCustomFit },
    });

    revalidatePath("/admin/products");

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    console.error("Lỗi toggleProductCustomFitAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật tùy chọn may đo.",
    };
  }
}
