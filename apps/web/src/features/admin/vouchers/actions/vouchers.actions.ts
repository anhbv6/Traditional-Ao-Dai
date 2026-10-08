"use server";

import { prisma } from "../../server/db.server";
import { authorizeAdminAction } from "../../server/adminAuth.server";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Bật/Tắt hiệu lực của Voucher
 */
export async function toggleVoucherActiveAction(voucherId: string, isActive: boolean) {
  const auth = await authorizeAdminAction({ role: "ADMIN" });
  if (!auth.success) return auth;

  try {
    const updated = await prisma.voucher.update({
      where: { id: voucherId },
      data: { isActive },
    });

    revalidatePath("/admin/vouchers");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi toggleVoucherActiveAction:", error);
    return {
      success: false,
      error: "VOUCHER_UPDATE_FAILED",
    };
  }
}
