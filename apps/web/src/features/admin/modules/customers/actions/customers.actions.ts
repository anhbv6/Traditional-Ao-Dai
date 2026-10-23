"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_ACTION_ACCESS } from "../../../core/session/permissions";
import { revalidatePath } from "next/cache";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toggleCustomerActiveSchema } from "../schemas/customers.schemas";

/**
 * Server Action: Khóa hoặc mở khóa tài khoản khách hàng (chỉ ADMIN).
 * Khóa -> thu hồi mọi phiên; access token storefront còn hạn tối đa 15 phút nhưng không refresh được nữa.
 */
export async function toggleCustomerActiveAction(userId: string, isActive: boolean) {
  const auth = await authorizeAdminAction(ADMIN_ACTION_ACCESS.toggleCustomerActive);
  if (!auth.success) return auth;

  const input = parseActionInput(toggleCustomerActiveSchema, { userId, isActive });
  if (!input.success) return input;

  try {
    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId, role: "CUSTOMER", status: { not: "DELETED" } },
        data: isActive
          ? { status: "ACTIVE", lockedAt: null, lockedReason: null }
          : { status: "LOCKED", lockedAt: new Date() },
        select: { id: true, status: true },
      }),
      ...(isActive ? [] : [prisma.userSession.deleteMany({ where: { userId } })]),
    ]);

    await recordAudit({
      actorId: auth.user.id,
      action: isActive ? "CUSTOMER_UNLOCKED" : "CUSTOMER_LOCKED",
      targetType: "USER",
      targetId: userId,
    });

    revalidatePath("/admin/customers");

    return { success: true, data: { id: updated.id, isActive: updated.status === "ACTIVE" } };
  } catch (error) {
    console.error("Lỗi toggleCustomerActiveAction:", error);
    return { success: false, error: "CUSTOMER_UPDATE_FAILED" };
  }
}
