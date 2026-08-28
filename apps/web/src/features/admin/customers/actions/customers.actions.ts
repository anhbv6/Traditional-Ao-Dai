"use server";

import { prisma } from "../../server/db.server";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Khóa hoặc mở khóa tài khoản khách hàng
 */
export async function toggleCustomerActiveAction(userId: string, isActive: boolean) {
  try {
    const updated = await prisma.user.update({
      where: { id: userId, role: "CUSTOMER" },
      data: { isActive },
    });

    revalidatePath("/admin/customers");

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    console.error("Lỗi toggleCustomerActiveAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật trạng thái khách hàng.",
    };
  }
}
