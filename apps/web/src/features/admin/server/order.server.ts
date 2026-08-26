"use server";

import { prisma, type OrderStatus } from "@repo/db";

export interface CreateStaffOrderInput {
  staffId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  note?: string;
  paymentMethod: "COD" | "VNPAY" | "MOMO" | "ZALOPAY" | "CASH_AT_STORE";
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    isCustomFit?: boolean;
    measurements?: {
      height?: number;
      weight?: number;
      bust?: number;
      waist?: number;
      hips?: number;
      shoulder?: number;
      armLength?: number;
      shirtLength?: number;
      pantsLength?: number;
      customNote?: string;
    };
  }>;
}

/**
 * Nhân viên tạo đơn hàng đặt hộ khách hàng tại quầy hoặc qua hotline
 */
export async function createStaffOrderAction(input: CreateStaffOrderInput) {
  try {
    const orderNumber = `AD-${Date.now().toString().slice(-6)}`;
    const totalAmount = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        createdById: input.staffId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        shippingAddress: input.shippingAddress,
        note: input.note,
        totalAmount,
        orderStatus: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: input.paymentMethod,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
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
    console.error("Lỗi khi tạo đơn hàng nhân viên:", error);
    return {
      success: false,
      error: "Không thể tạo đơn hàng trên hệ thống.",
    };
  }
}

/**
 * Lấy danh sách đơn hàng cho Admin & Staff trực tiếp từ DB
 */
export async function getAdminOrdersAction() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    return {
      success: false,
      error: "Không thể tải danh sách đơn hàng.",
    };
  }
}

/**
 * Cập nhật trạng thái đơn hàng
 */
export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
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
    console.error("Lỗi khi cập nhật trạng thái đơn:", error);
    return {
      success: false,
      error: "Không thể cập nhật trạng thái đơn hàng.",
    };
  }
}
