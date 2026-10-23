"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { type OrderStatus, type PaymentStatus } from "../types/orders.types";
import { revalidatePath } from "next/cache";
import { type z } from "zod";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { requestOrderApprovalSchema, updateOrderStatusSchema, updatePaymentStatusSchema } from "../schemas/orders.schemas";

/**
 * Server Action: Cập nhật trạng thái đơn hàng (OrderStatus)
 */
export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_ORDERS" });
  if (!auth.success) return auth;

  const input = parseActionInput(updateOrderStatusSchema, { orderId, status });
  if (!input.success) return input;

  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi updateOrderStatusAction:", error);
    return {
      success: false,
      error: "ORDER_STATUS_UPDATE_FAILED",
    };
  }
}

/**
 * Server Action: Cập nhật trạng thái thanh toán (PaymentStatus)
 */
export async function updatePaymentStatusAction(orderId: string, paymentStatus: PaymentStatus) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_ORDERS" });
  if (!auth.success) return auth;

  const input = parseActionInput(updatePaymentStatusSchema, { orderId, paymentStatus });
  if (!input.success) return input;

  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi updatePaymentStatusAction:", error);
    return {
      success: false,
      error: "PAYMENT_STATUS_UPDATE_FAILED",
    };
  }
}

/**
 * Server Action: Gửi yêu cầu phê duyệt hủy đơn hoặc hoàn tiền (Dành cho Staff)
 */
export async function requestOrderApprovalAction(raw: z.input<typeof requestOrderApprovalSchema>) {
  const auth = await authorizeAdminAction();
  if (!auth.success) return auth;

  const parsed = parseActionInput(requestOrderApprovalSchema, raw);
  if (!parsed.success) return parsed;
  const params = parsed.data;

  try {
    const approval = await prisma.approvalRequest.create({
      data: {
        actionType: params.actionType,
        targetId: params.orderId,
        description: params.description,
        payload: {
          orderId: params.orderId,
          ...(params.payload || {}),
        },
        requestedById: auth.user.id,
      },
    });

    revalidatePath("/admin/approvals");

    return {
      success: true,
      data: approval,
    };
  } catch (error) {
    console.error("Lỗi requestOrderApprovalAction:", error);
    return {
      success: false,
      error: "APPROVAL_CREATE_FAILED",
    };
  }
}
