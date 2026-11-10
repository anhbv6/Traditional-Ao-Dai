"use server";

import { revalidatePath } from "next/cache";
import { type z } from "zod";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_ACTION_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toggleCustomerActiveSchema } from "../schemas/customers.schemas";

/**
 * Khóa hoặc mở khóa tài khoản khách hàng (chỉ ADMIN), lưu lý do khóa.
 * Khóa -> thu hồi mọi phiên; access token storefront còn hạn tối đa 15 phút nhưng không refresh được nữa.
 */
export async function toggleCustomerActiveAction(raw: z.input<typeof toggleCustomerActiveSchema>) {
  const auth = await authorizeAdminAction(ADMIN_ACTION_ACCESS.toggleCustomerActive);
  if (!auth.success) return auth;
  const input = parseActionInput(toggleCustomerActiveSchema, raw);
  if (!input.success) return input;
  const { userId, isActive, reason } = input.data;

  try {
    const lockedAt = new Date();
    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId, role: "CUSTOMER", status: { not: "DELETED" } },
        data: isActive
          ? { status: "ACTIVE", lockedAt: null, lockedReason: null }
          : { status: "LOCKED", lockedAt, lockedReason: reason || null },
        select: { id: true, status: true },
      }),
      ...(isActive ? [] : [prisma.userSession.deleteMany({ where: { userId } })]),
    ]);

    await recordAudit({
      actorId: auth.user.id,
      action: isActive ? "CUSTOMER_UNLOCKED" : "CUSTOMER_LOCKED",
      targetType: "USER",
      targetId: userId,
      metadata: isActive ? undefined : { reason: reason || null },
    });

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${userId}`);
    return {
      success: true as const,
      data: {
        id: updated.id,
        status: updated.status === "LOCKED" ? ("LOCKED" as const) : ("ACTIVE" as const),
        lockedAt: isActive ? null : lockedAt.toISOString(),
        lockedReason: isActive ? null : reason || null,
      },
    };
  } catch (error) {
    console.error("Lỗi toggleCustomerActiveAction:", error);
    return { success: false as const, error: "CUSTOMER_UPDATE_FAILED" };
  }
}
