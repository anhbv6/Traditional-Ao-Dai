"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { ADMIN_ACTION_ACCESS } from "../../../core/session/permissions";
import { revalidatePath } from "next/cache";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toggleCustomerActiveSchema } from "../schemas/customers.schemas";

/**
 * Server Action: Khóa hoặc mở khóa tài khoản khách hàng
 */
export async function toggleCustomerActiveAction(userId: string, isActive: boolean) {
  const auth = await authorizeAdminAction(ADMIN_ACTION_ACCESS.toggleCustomerActive);
  if (!auth.success) return auth;

  const input = parseActionInput(toggleCustomerActiveSchema, { userId, isActive });
  if (!input.success) return input;

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
