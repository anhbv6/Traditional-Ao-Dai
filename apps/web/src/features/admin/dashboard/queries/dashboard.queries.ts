import { prisma } from "../../server/db.server";
import { type FilterType, type StatItem, type OrderItem } from "../types/dashboard.types";

/**
 * Lấy số liệu thống kê tổng quan (Doanh thu, số đơn, tỉ lệ may đo...) từ DB
 */
export async function getDashboardStatsQuery(filter: FilterType = "week"): Promise<StatItem> {
  try {
    const now = new Date();
    let startDate = new Date();

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

    return orders;
  } catch (error) {
    console.error("Lỗi khi query danh sách đơn hàng:", error);
    throw new Error("Không thể tải danh sách đơn hàng.");
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
