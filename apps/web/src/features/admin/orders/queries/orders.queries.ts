import { prisma } from "../../server/db.server";
import { type AdminOrderItem, type OrderFilterParams } from "../types/orders.types";

/**
 * Query: Lấy danh sách đơn hàng cho Admin & Staff
 * Chỉ dùng cho Server Components để render sẵn HTML
 */
export async function getAdminOrdersListQuery(
  params?: OrderFilterParams
): Promise<AdminOrderItem[]> {
  try {
    const whereCondition: any = {};

    if (params?.status && params.status !== "ALL") {
      whereCondition.orderStatus = params.status;
    }

    if (params?.paymentStatus && params.paymentStatus !== "ALL") {
      whereCondition.paymentStatus = params.paymentStatus;
    }

    if (params?.search) {
      whereCondition.OR = [
        { orderNumber: { contains: params.search, mode: "insensitive" } },
        { customerName: { contains: params.search, mode: "insensitive" } },
        { customerPhone: { contains: params.search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            variantName: true,
            sku: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            isCustomFit: true,
            tailoringStatus: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: params?.limit || 50,
    });

    return orders.map((o) => ({
      ...o,
      subTotal: Number(o.subTotal),
      discountAmount: Number(o.discountAmount),
      shippingFee: Number(o.shippingFee),
      totalAmount: Number(o.totalAmount),
      items: o.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    })) as AdminOrderItem[];
  } catch (error) {
    console.error("Lỗi khi query danh sách đơn hàng Admin:", error);
    return [];
  }
}

/**
 * Query: Lấy chi tiết một đơn hàng theo ID
 */
export async function getAdminOrderDetailQuery(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            tailoringLogs: {
              include: {
                staff: { select: { id: true, name: true, email: true } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        voucher: true,
      },
    });

    return order;
  } catch (error) {
    console.error(`Lỗi khi query chi tiết đơn hàng ${orderId}:`, error);
    return null;
  }
}
