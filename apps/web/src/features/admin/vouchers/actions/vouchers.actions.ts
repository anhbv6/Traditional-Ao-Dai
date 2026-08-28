"use server";

import { prisma } from "../../server/db.server";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Bật/Tắt hiệu lực của Voucher
 */
export async function toggleVoucherActiveAction(voucherId: string, isActive: boolean) {
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
  } catch (error: any) {
    console.error("Lỗi toggleVoucherActiveAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật trạng thái voucher.",
    };
  }
}
