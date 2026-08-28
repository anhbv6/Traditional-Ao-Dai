"use server";

import { prisma } from "../../server/db.server";
import { type OrderStatus as DbOrderStatus } from "@repo/db";
import { type CreateStaffOrderInput } from "../types/dashboard.types";
import { getAdminOrdersQuery, getDashboardStatsQuery } from "../queries/dashboard.queries";

/**
 * Server Action: Lấy thống kê số liệu Dashboard
 */
export async function getDashboardStatsAction(filter: "today" | "week" | "month" = "week") {
  try {
    const stats = await getDashboardStatsQuery(filter);
    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    console.error("Lỗi Action getDashboardStatsAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể tải số liệu thống kê.",
    };
  }
}

/**
 * Server Action: Lấy danh sách đơn hàng cho Admin & Staff trực tiếp từ DB
 */
export async function getAdminOrdersAction() {
  try {
    const orders = await getAdminOrdersQuery();
    return {
      success: true,
      data: orders,
    };
  } catch (error: any) {
    console.error("Lỗi Action getAdminOrdersAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể tải danh sách đơn hàng.",
    };
  }
}

/**
 * Server Action: Cập nhật trạng thái đơn hàng
 */
export async function updateOrderStatusAction(orderId: string, status: DbOrderStatus) {
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
      error: "Không thể cập nhật trạng thái đơn hàng.",
    };
  }
}

/**
 * Server Action: Nhân viên tạo đơn hàng đặt hộ khách hàng tại quầy hoặc qua hotline
 */
export async function createStaffOrderAction(input: CreateStaffOrderInput) {
  try {
    const orderNumber = `AD-${Date.now().toString().slice(-6)}`;
    const subTotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = subTotal;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        createdById: input.staffId,
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
      error: "Không thể tạo đơn hàng trên hệ thống.",
    };
  }
}
