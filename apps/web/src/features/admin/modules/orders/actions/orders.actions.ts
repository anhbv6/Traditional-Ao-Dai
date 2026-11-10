"use server";

import { revalidatePath } from "next/cache";
import { type z } from "zod";
import { toVnd } from "@repo/shared";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { advanceOrderSchema, recordOrderPaymentSchema, requestOrderApprovalSchema } from "../schemas/orders.schemas";
import { canPack, nextOrderStatus, resolvePaymentStatus } from "../utils/orderFlow";

function revalidateOrder(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/dashboard");
}

/**
 * Chuyển đơn sang bước kế tiếp của vòng đời (xác nhận → đóng gói → giao → đã giao).
 * Chỉ nhận đúng bước kế theo `nextOrderStatus`; đơn may đo chỉ đóng gói khi mọi món đã xong xưởng.
 */
export async function advanceOrderAction(raw: z.input<typeof advanceOrderSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_ORDERS" });
  if (!auth.success) return auth;
  const input = parseActionInput(advanceOrderSchema, raw);
  if (!input.success) return input;
  const { orderId, status } = input.data;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderStatus: true, items: { select: { isCustomFit: true, tailoringStatus: true } } },
    });
    if (!order) return { success: false as const, error: "ORDER_NOT_FOUND" };
    const workshopDone = canPack(order.items.filter((item) => item.isCustomFit).map((item) => item.tailoringStatus));
    if (status === "READY_TO_SHIP" && !workshopDone) return { success: false as const, error: "ORDER_TAILORING_NOT_DONE" };
    if (nextOrderStatus(order.orderStatus, workshopDone) !== status) {
      return { success: false as const, error: "ORDER_STATUS_TRANSITION_INVALID" };
    }

    await prisma.order.update({ where: { id: orderId }, data: { orderStatus: status } });
    await recordAudit({
      actorId: auth.user.id,
      action: "ORDER_STATUS_CHANGED",
      targetType: "ORDER",
      targetId: orderId,
      metadata: { from: order.orderStatus, to: status },
    });
    revalidateOrder(orderId);
    return { success: true as const, data: { orderStatus: status } };
  } catch (error) {
    console.error("Lỗi advanceOrderAction:", error);
    return { success: false as const, error: "ORDER_STATUS_UPDATE_FAILED" };
  }
}

/**
 * Ghi nhận tiền đã nhận (đối soát chuyển khoản theo nội dung THIENCANH <mã>, hoặc thu COD) —
 * cộng vào `paidAmount`, không vượt tổng đơn; trạng thái thanh toán tự suy ra.
 */
export async function recordOrderPaymentAction(raw: z.input<typeof recordOrderPaymentSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_ORDERS" });
  if (!auth.success) return auth;
  const input = parseActionInput(recordOrderPaymentSchema, raw);
  if (!input.success) return input;
  const { orderId, amount, note } = input.data;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { totalAmount: true, paidAmount: true, paymentStatus: true, orderStatus: true },
    });
    if (!order) return { success: false as const, error: "ORDER_NOT_FOUND" };
    if (order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED") {
      return { success: false as const, error: "ORDER_CLOSED" };
    }
    const total = toVnd(order.totalAmount);
    const before = toVnd(order.paidAmount);
    if (before + amount > total) return { success: false as const, error: "ORDER_PAYMENT_EXCEEDS_TOTAL" };

    const paid = before + amount;
    const paymentStatus = resolvePaymentStatus(paid, total, order.paymentStatus);
    await prisma.order.update({ where: { id: orderId }, data: { paidAmount: paid, paymentStatus } });
    await recordAudit({
      actorId: auth.user.id,
      action: "ORDER_PAYMENT_RECORDED",
      targetType: "ORDER",
      targetId: orderId,
      metadata: { amount, before, after: paid, note: note || null },
    });
    revalidateOrder(orderId);
    return { success: true as const, data: { paidAmount: paid, paymentStatus } };
  } catch (error) {
    console.error("Lỗi recordOrderPaymentAction:", error);
    return { success: false as const, error: "PAYMENT_STATUS_UPDATE_FAILED" };
  }
}

/**
 * Gửi yêu cầu phê duyệt hủy đơn / hoàn tiền / giảm giá tay — duyệt xong hệ thống tự thực thi.
 * Mỗi đơn chỉ một yêu cầu đang chờ cho cùng loại.
 */
export async function requestOrderApprovalAction(raw: z.input<typeof requestOrderApprovalSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_ORDERS" });
  if (!auth.success) return auth;
  const parsed = parseActionInput(requestOrderApprovalSchema, raw);
  if (!parsed.success) return parsed;
  const params = parsed.data;

  try {
    const order = await prisma.order.findUnique({ where: { id: params.orderId }, select: { orderStatus: true } });
    if (!order) return { success: false as const, error: "ORDER_NOT_FOUND" };
    if (order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED") {
      return { success: false as const, error: "ORDER_CLOSED" };
    }
    const duplicate = await prisma.approvalRequest.findFirst({
      where: { status: "PENDING", targetId: params.orderId, actionType: params.actionType },
      select: { id: true },
    });
    if (duplicate) return { success: false as const, error: "APPROVAL_ALREADY_PENDING" };

    const approval = await prisma.approvalRequest.create({
      data: {
        actionType: params.actionType,
        targetId: params.orderId,
        description: params.description,
        payload: { orderId: params.orderId, ...(params.payload || {}) },
        requestedById: auth.user.id,
      },
      select: { id: true },
    });

    revalidatePath("/admin/approvals");
    revalidateOrder(params.orderId);
    return { success: true as const, data: { approvalId: approval.id } };
  } catch (error) {
    console.error("Lỗi requestOrderApprovalAction:", error);
    return { success: false as const, error: "APPROVAL_CREATE_FAILED" };
  }
}
