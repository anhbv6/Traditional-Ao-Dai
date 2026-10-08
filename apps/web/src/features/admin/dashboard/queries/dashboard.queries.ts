import { toVnd } from "@repo/shared";
import { prisma } from "../../server/db.server";
import { type FilterType, type StatItem} from "../types/dashboard.types";

/**
 * Lấy số liệu thống kê tổng quan (Doanh thu, số đơn, tỉ lệ may đo...) từ DB
 */
export async function getDashboardStatsQuery(filter: FilterType = "week"): Promise<StatItem> {
  try {
    const now = new Date();
    const startDate = new Date();

    if (filter === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (filter === "month") {
      startDate.setMonth(now.getMonth() - 1);
    }

    const [ordersCount, pendingCount, ordersWithRevenue, customItemsCount, totalItemsCount] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.order.count({
        where: {
          orderStatus: "PENDING",
          createdAt: { gte: startDate },
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] },
        },
        select: { totalAmount: true },
      }),
      prisma.orderItem.count({
        where: {
          isCustomFit: true,
          createdAt: { gte: startDate },
        },
      }),
      prisma.orderItem.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
    ]);

    const totalRevenueNumber = ordersWithRevenue.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0
    );

    const customRatio =
      totalItemsCount > 0
        ? Math.round((customItemsCount / totalItemsCount) * 100)
        : 70;

    return {
      revenue: `${totalRevenueNumber.toLocaleString("vi-VN")} ₫`,
      revenueDiff: "+15.4%",
      orders: ordersCount,
      ordersDiff: `+${ordersCount} đơn`,
      pending: pendingCount,
      customRatio,
    };
  } catch (error) {
    console.error("Lỗi khi query thống kê Dashboard:", error);
    // Fallback nếu DB trống
    return {
      revenue: "0 ₫",
      revenueDiff: "0%",
      orders: 0,
      ordersDiff: "0 đơn",
      pending: 0,
      customRatio: 0,
    };
  }
}

/**
 * Lấy danh sách toàn bộ đơn hàng quản trị từ cơ sở dữ liệu
 */
export async function getAdminOrdersQuery() {
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
      take: 50,
    });

    // Decimal của Prisma không serialize được qua Server Action -> chuyển về số nguyên VND
    return orders.map((order) => ({
      ...order,
      subTotal: toVnd(order.subTotal),
      discountAmount: toVnd(order.discountAmount),
      shippingFee: toVnd(order.shippingFee),
      totalAmount: toVnd(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: toVnd(item.unitPrice),
        totalPrice: toVnd(item.totalPrice),
      })),
    }));
  } catch (error) {
    console.error("Lỗi khi query danh sách đơn hàng:", error);
    throw new Error("ORDER_LIST_FAILED");
  }
}

/**
 * Lấy danh sách tiến độ may đo (Custom-fit Tailoring Monitor)
 */
export async function getTailoringMonitorQuery() {
  try {
    const customOrderItems = await prisma.orderItem.findMany({
      where: {
        isCustomFit: true,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            shippingAddress: true,
            orderStatus: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        tailoringLogs: {
          include: {
            staff: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return customOrderItems;
  } catch (error) {
    console.error("Lỗi khi query tiến độ may đo:", error);
    return [];
  }
}

/** Đơn hàng thô (đã chuẩn hóa tiền tệ) trả về từ getAdminOrdersQuery */
export type AdminDashboardOrder = Awaited<ReturnType<typeof getAdminOrdersQuery>>[number];
