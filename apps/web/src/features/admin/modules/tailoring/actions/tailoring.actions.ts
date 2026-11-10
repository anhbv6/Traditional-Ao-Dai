"use server";

import { revalidatePath } from "next/cache";
import { type z } from "zod";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { updateTailoringStatusSchema } from "../schemas/tailoring.schemas";

/**
 * Chuyển công đoạn một món may đo và ghi TailoringLog (thợ = người đang đăng nhập).
 * - Đơn đã hủy / hoàn tiền: không cho đi tiếp (chỉ cho ghi lùi về chờ vải hoặc ghi chú dừng).
 * - Món đầu tiên rời "chờ vải" khi đơn đang CONFIRMED → đơn chuyển IN_PRODUCTION.
 */
export async function updateTailoringStatusAction(raw: z.input<typeof updateTailoringStatusSchema>) {
  const auth = await authorizeAdminAction({ permission: "UPDATE_TAILORING" });
  if (!auth.success) return auth;
  const parsed = parseActionInput(updateTailoringStatusSchema, raw);
  if (!parsed.success) return parsed;
  const { orderItemId, status, note } = parsed.data;

  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: { id: true, isCustomFit: true, orderId: true, order: { select: { orderStatus: true } } },
    });
    if (!item || !item.isCustomFit) return { success: false as const, error: "TAILORING_ITEM_NOT_FOUND" };

    const cancelled = item.order.orderStatus === "CANCELLED" || item.order.orderStatus === "REFUNDED";
    if (cancelled && status !== "WAITING_FABRIC") return { success: false as const, error: "TAILORING_ORDER_CANCELLED" };

    const startsProduction = status !== "WAITING_FABRIC" && item.order.orderStatus === "CONFIRMED";

    const log = await prisma.$transaction(async (tx) => {
      await tx.orderItem.update({ where: { id: orderItemId }, data: { tailoringStatus: status } });
      if (startsProduction) {
        await tx.order.update({ where: { id: item.orderId }, data: { orderStatus: "IN_PRODUCTION" } });
      }
      return tx.tailoringLog.create({
        data: { orderId: item.orderId, orderItemId, status, staffId: auth.user.id, note: note || null },
        select: { id: true, createdAt: true },
      });
    });

    revalidatePath("/admin/tailoring");
    revalidatePath(`/admin/tailoring/${item.orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return {
      success: true as const,
      data: {
        logId: log.id,
        createdAt: log.createdAt.toISOString(),
        staffName: auth.user.name ?? auth.user.email ?? null,
        orderStatus: startsProduction ? ("IN_PRODUCTION" as const) : item.order.orderStatus,
      },
    };
  } catch (error) {
    console.error("Lỗi updateTailoringStatusAction:", error);
    return { success: false as const, error: "TAILORING_UPDATE_FAILED" };
  }
}
