"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { revalidatePath } from "next/cache";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toggleVoucherActiveSchema } from "../schemas/vouchers.schemas";

/**
 * Server Action: Bật/Tắt hiệu lực của Voucher
 */
export async function toggleVoucherActiveAction(voucherId: string, isActive: boolean) {
  const auth = await authorizeAdminAction({ role: "ADMIN" });
  if (!auth.success) return auth;

  const input = parseActionInput(toggleVoucherActiveSchema, { voucherId, isActive });
  if (!input.success) return input;

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
