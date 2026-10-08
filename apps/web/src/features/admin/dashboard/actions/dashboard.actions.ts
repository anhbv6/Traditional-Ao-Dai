"use server";

import { prisma } from "../../server/db.server";
import { authorizeAdminAction } from "../../server/adminAuth.server";
import { type OrderStatus as DbOrderStatus } from "@repo/db";
import { type CreateStaffOrderInput } from "../types/dashboard.types";
import { getAdminOrdersQuery, getDashboardStatsQuery } from "../queries/dashboard.queries";

/**
 * Server Action: Lấy thống kê số liệu Dashboard
 */
export async function getDashboardStatsAction(filter: "today" | "week" | "month" = "week") {
  const auth = await authorizeAdminAction();
  if (!auth.success) return auth;

  try {
    const stats = await getDashboardStatsQuery(filter);
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Lỗi Action getDashboardStatsAction:", error);
    return {
      success: false,
      error: "DASHBOARD_STATS_FAILED",
    };
  }
}

/**
 * Server Action: Lấy danh sách đơn hàng cho Admin & Staff trực tiếp từ DB
 */
export async function getAdminOrdersAction() {
  const auth = await authorizeAdminAction({ permission: "canManageOrders" });
  if (!auth.success) return auth;

  try {
    const orders = await getAdminOrdersQuery();
    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error("Lỗi Action getAdminOrdersAction:", error);
    return {
      success: false,
      error: "ORDER_LIST_FAILED",
    };
  }
}

/**
 * Server Action: Cập nhật trạng thái đơn hàng
 */
export async function updateOrderStatusAction(orderId: string, status: DbOrderStatus) {
  const auth = await authorizeAdminAction({ permission: "canManageOrders" });
  if (!auth.success) return auth;

  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi Action updateOrderStatusAction:", error);
    return {
      success: false,
      error: "ORDER_STATUS_UPDATE_FAILED",
    };
  }
}

/**
 * Server Action: Nhân viên tạo đơn hàng đặt hộ khách hàng tại quầy hoặc qua hotline
 */
export async function createStaffOrderAction(input: CreateStaffOrderInput) {
  const auth = await authorizeAdminAction({ permission: "canManageOrders" });
  if (!auth.success) return auth;

  try {
    const orderNumber = `AD-${Date.now().toString().slice(-6)}`;
    const subTotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = subTotal;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        createdById: auth.user.id,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        shippingAddress: input.shippingAddress,
        note: input.note,
        subTotal,
        discountAmount: 0,
        shippingFee: 0,
        totalAmount,
        orderStatus: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: input.paymentMethod,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: "Áo Dài Truyền Thống",
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            isCustomFit: Boolean(item.isCustomFit),
            height: item.measurements?.height,
            weight: item.measurements?.weight,
            bust: item.measurements?.bust,
            waist: item.measurements?.waist,
            hips: item.measurements?.hips,
            shoulder: item.measurements?.shoulder,
            armLength: item.measurements?.armLength,
            shirtLength: item.measurements?.shirtLength,
            pantsLength: item.measurements?.pantsLength,
            customNote: item.measurements?.customNote,
          })),
        },
      },
      include: {
        items: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error("Lỗi Action createStaffOrderAction:", error);
    return {
      success: false,
      error: "ORDER_CREATE_FAILED",
    };
  }
}
