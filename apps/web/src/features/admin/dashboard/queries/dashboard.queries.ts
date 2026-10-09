import { formatVnd, toVnd } from "@repo/shared";
import { prisma } from "../../server/db.server";
import { type FilterType, type StatItem} from "../types/dashboard.types";

/**
 * Lấy số liệu thống kê tổng quan (Doanh thu, số đơn, tỉ lệ may đo...) từ DB
 */
const PAID_STATUSES = ["PAID", "PARTIALLY_PAID"] as const;

/** Mốc bắt đầu của kỳ thống kê */
function getPeriodStart(filter: FilterType, now: Date): Date {
  const start = new Date(now);
  if (filter === "today") start.setHours(0, 0, 0, 0);
  else if (filter === "week") start.setDate(now.getDate() - 7);
  else start.setMonth(now.getMonth() - 1);
  return start;
}

/** Định dạng chênh lệch phần trăm so với kỳ trước (kỳ trước = 0 thì không so sánh được) */
function formatPercentDiff(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "Mới" : "0%";
  const diff = ((current - previous) / previous) * 100;
  return `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;
}

async function sumPaidRevenue(from: Date, to: Date): Promise<number> {
  const result = await prisma.order.aggregate({
    where: { createdAt: { gte: from, lt: to }, paymentStatus: { in: [...PAID_STATUSES] } },
    _sum: { totalAmount: true },
  });
  return toVnd(result._sum.totalAmount);
}

/**
 * Lấy số liệu thống kê tổng quan (doanh thu, số đơn, tỉ lệ may đo...) và so sánh với kỳ trước cùng độ dài
 */
export async function getDashboardStatsQuery(filter: FilterType = "week"): Promise<StatItem> {
  try {
    const now = new Date();
    const startDate = getPeriodStart(filter, now);
    // Kỳ trước: cùng độ dài, kết thúc ngay trước kỳ hiện tại
    const previousStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

    const [revenue, previousRevenue, ordersCount, previousOrdersCount, pendingCount, customItemsCount, totalItemsCount] =
      await Promise.all([
        sumPaidRevenue(startDate, now),
        sumPaidRevenue(previousStart, startDate),
        prisma.order.count({ where: { createdAt: { gte: startDate } } }),
        prisma.order.count({ where: { createdAt: { gte: previousStart, lt: startDate } } }),
        prisma.order.count({ where: { orderStatus: "PENDING", createdAt: { gte: startDate } } }),
        prisma.orderItem.count({ where: { isCustomFit: true, createdAt: { gte: startDate } } }),
        prisma.orderItem.count({ where: { createdAt: { gte: startDate } } }),
      ]);

    const ordersDelta = ordersCount - previousOrdersCount;

    return {
      revenue: formatVnd(revenue),
      revenueDiff: formatPercentDiff(revenue, previousRevenue),
      orders: ordersCount,
      ordersDiff: `${ordersDelta > 0 ? "+" : ""}${ordersDelta} đơn`,
      pending: pendingCount,
      customRatio: totalItemsCount > 0 ? Math.round((customItemsCount / totalItemsCount) * 100) : 0,
    };
  } catch (error) {
    console.error("Lỗi khi query thống kê Dashboard:", error);
    throw new Error("DASHBOARD_STATS_FAILED");
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

/** Ngưỡng tồn kho coi là "sắp hết hàng" */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Các biến thể (SKU) của sản phẩm đang bán có tồn kho thấp — dùng cho khối cảnh báo trên dashboard
 */
export async function getLowStockVariantsQuery(limit = 6) {
  const variants = await prisma.productVariant.findMany({
    where: { stock: { lte: LOW_STOCK_THRESHOLD }, product: { isActive: true } },
    orderBy: { stock: "asc" },
    take: limit,
    select: { id: true, sku: true, size: true, color: true, stock: true, product: { select: { name: true } } },
  });

  return variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    stock: variant.stock,
    productName: variant.product.name,
  }));
}

export type LowStockVariant = Awaited<ReturnType<typeof getLowStockVariantsQuery>>[number];
