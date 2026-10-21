import { type Prisma } from "@repo/db";
import { toVnd } from "@repo/shared";
import { prisma } from "../../../core/server/db.server";
import { type AdminOrderItem, type OrderFilterParams } from "../types/orders.types";

/**
 * Query: Lấy danh sách đơn hàng cho Admin & Staff
 * Chỉ dùng cho Server Components để render sẵn HTML
 */
export async function getAdminOrdersListQuery(
  params?: OrderFilterParams
): Promise<AdminOrderItem[]> {
  try {
    const whereCondition: Prisma.OrderWhereInput = {};

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
      // Decimal của Prisma không truyền được qua Server -> Client Component: đổi hết sang số nguyên VND
      subTotal: toVnd(o.subTotal),
      discountAmount: toVnd(o.discountAmount),
      shippingFee: toVnd(o.shippingFee),
      totalAmount: toVnd(o.totalAmount),
      paidAmount: toVnd(o.paidAmount),
      items: o.items.map((item) => ({
        ...item,
        unitPrice: toVnd(item.unitPrice),
        totalPrice: toVnd(item.totalPrice),
      })),
    })) as AdminOrderItem[];
  } catch (error) {
    console.error("Lỗi khi query danh sách đơn hàng Admin:", error);
    return [];
  }
}
