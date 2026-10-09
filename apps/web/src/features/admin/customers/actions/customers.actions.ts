"use server";

import { prisma } from "../../server/db.server";
import { authorizeAdminAction } from "../../server/adminAuth.server";
import { ADMIN_ACTION_ACCESS } from "../../session/permissions";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Khóa hoặc mở khóa tài khoản khách hàng
 */
export async function toggleCustomerActiveAction(userId: string, isActive: boolean) {
  const auth = await authorizeAdminAction(ADMIN_ACTION_ACCESS.toggleCustomerActive);
  if (!auth.success) return auth;

  try {
    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId, role: "CUSTOMER" },
        data: { isActive },
        select: { id: true, isActive: true },
      }),
      // Khóa tài khoản -> thu hồi mọi phiên (refresh token) của khách hàng
      ...(isActive ? [] : [prisma.userSession.deleteMany({ where: { userId } })]),
    ]);

    revalidatePath("/admin/customers");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi toggleCustomerActiveAction:", error);
    return {
      success: false,
      error: "CUSTOMER_UPDATE_FAILED",
    };
  }
}
