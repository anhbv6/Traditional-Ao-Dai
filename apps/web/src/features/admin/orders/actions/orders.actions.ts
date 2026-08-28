"use server";

import { prisma } from "../../server/db.server";
import { type OrderStatus, type PaymentStatus } from "../types/orders.types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Cập nhật trạng thái đơn hàng (OrderStatus)
 */
export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
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
  } catch (error: any) {
    console.error("Lỗi updateOrderStatusAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật trạng thái đơn hàng.",
    };
  }
}

/**
 * Server Action: Cập nhật trạng thái thanh toán (PaymentStatus)
 */
export async function updatePaymentStatusAction(orderId: string, paymentStatus: PaymentStatus) {
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
  } catch (error: any) {
    console.error("Lỗi updatePaymentStatusAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật trạng thái thanh toán.",
    };
  }
}

/**
 * Server Action: Gửi yêu cầu phê duyệt hủy đơn hoặc hoàn tiền (Dành cho Staff)
 */
export async function requestOrderApprovalAction(params: {
  orderId: string;
  actionType: "CANCEL_ORDER" | "REFUND" | "MANUAL_DISCOUNT";
  description: string;
  requestedById: string;
  payload?: any;
}) {
  try {
    const approval = await prisma.approvalRequest.create({
      data: {
        actionType: params.actionType,
        description: params.description,
        payload: {
          orderId: params.orderId,
          ...(params.payload || {}),
        },
        requestedById: params.requestedById,
      },
    });

    revalidatePath("/admin/approvals");

    return {
      success: true,
      data: approval,
    };
  } catch (error: any) {
    console.error("Lỗi requestOrderApprovalAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể gửi yêu cầu phê duyệt.",
    };
  }
}
