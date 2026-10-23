"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { revalidatePath } from "next/cache";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toggleProductActiveSchema, toggleProductCustomFitSchema } from "../schemas/products.schemas";

/**
 * Server Action: Bật/Tắt trạng thái hoạt động của sản phẩm
 */
export async function toggleProductActiveAction(productId: string, isActive: boolean) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;

  const input = parseActionInput(toggleProductActiveSchema, { productId, isActive });
  if (!input.success) return input;

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
  } catch (error) {
    console.error("Lỗi toggleProductActiveAction:", error);
    return {
      success: false,
      error: "PRODUCT_UPDATE_FAILED",
    };
  }
}

/**
 * Server Action: Bật/Tắt tính năng may đo riêng (Custom Fit)
 */
export async function toggleProductCustomFitAction(productId: string, isCustomFit: boolean) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;

  const input = parseActionInput(toggleProductCustomFitSchema, { productId, isCustomFit });
  if (!input.success) return input;

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
  } catch (error) {
    console.error("Lỗi toggleProductCustomFitAction:", error);
    return {
      success: false,
      error: "PRODUCT_UPDATE_FAILED",
    };
  }
}
