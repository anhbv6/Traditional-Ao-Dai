import { type OrderStatus as DbOrderStatus } from "@repo/db";
import { formatVnd } from "@repo/shared";
import { type AdminDashboardOrder } from "../queries/dashboard.queries";

export type FilterType = "today" | "week" | "month";

export type OrderStatus =
  | "pending_approval"
  | "cutting_fabric"
  | "sewing_job"
  | "completed"
  | "shipping";

export interface StatItem {
  revenue: string;
  revenueDiff: string;
  orders: number;
  ordersDiff: string;
  pending: number;
  customRatio: number;
}

export interface Measurement {
  height: string;
  weight: string;
  bust: string;
  waist: string;
  hips: string;
  neckToWaist: string;
}

export interface OrderItemProduct {
  name: string;
  price: string;
  quantity: number;
  size?: string;
}

export interface OrderItem {
  id: string;
  rawId?: string;
  customer: string;
  type: "custom" | "ready";
  total: string;
  status: OrderStatus;
  date: string;
  items: OrderItemProduct[];
  phone: string;
  address: string;
  measurements?: Measurement;
}

export interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

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

export interface UpdateOrderStatusInput {
  orderId: string;
  status: DbOrderStatus;
}

/**
 * Chuyển đổi trạng thái đơn hàng từ Prisma DB sang UI
 */
export function mapDbStatusToUiStatus(status: DbOrderStatus): OrderStatus {
  switch (status) {
    case "PENDING":
      return "pending_approval";
    case "CONFIRMED":
      return "cutting_fabric";
    case "IN_PRODUCTION":
      return "sewing_job";
    case "READY_TO_SHIP":
    case "SHIPPING":
      return "shipping";
    case "DELIVERED":
      return "completed";
    default:
      return "pending_approval";
  }
}

/**
 * Chuyển đổi trạng thái đơn hàng từ UI sang Prisma DB
 */
export function mapUiStatusToDbStatus(status: OrderStatus): DbOrderStatus {
  switch (status) {
    case "pending_approval":
      return "PENDING";
    case "cutting_fabric":
      return "CONFIRMED";
    case "sewing_job":
      return "IN_PRODUCTION";
    case "shipping":
      return "SHIPPING";
    case "completed":
      return "DELIVERED";
    default:
      return "PENDING";
  }
}

/**
 * Chuyển đổi dữ liệu đơn hàng từ Prisma DB sang OrderItem cho giao diện Dashboard
 */
export function mapPrismaOrderToOrderItem(order: AdminDashboardOrder): OrderItem {
  const isCustom = order.items.some((i) => i.isCustomFit);
  const customItem = order.items.find((i) => i.isCustomFit && (i.height || i.bust || i.waist));

  const measurements: Measurement | undefined = customItem
    ? {
        height: customItem.height ? `${customItem.height} cm` : "—",
        weight: customItem.weight ? `${customItem.weight} kg` : "—",
        bust: customItem.bust ? `${customItem.bust} cm` : "—",
        waist: customItem.waist ? `${customItem.waist} cm` : "—",
        hips: customItem.hips ? `${customItem.hips} cm` : "—",
        neckToWaist: customItem.shirtLength ? `${customItem.shirtLength} cm` : "—",
      }
    : undefined;

  let dateStr = "—";
  if (order.createdAt) {
    try {
      const d = new Date(order.createdAt);
      dateStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`;
    } catch {}
  }

  return {
    id: order.orderNumber || order.id,
    rawId: order.id,
    customer: order.customerName || order.createdBy?.name || "Khách hàng",
    type: isCustom ? "custom" : "ready",
    total: formatVnd(order.totalAmount),
    status: mapDbStatusToUiStatus(order.orderStatus),
    date: dateStr,
    phone: order.customerPhone || "—",
    address: order.shippingAddress || "—",
    items: order.items.map((item) => ({
      name: item.productName || item.product?.name || "Áo Dài",
      price: formatVnd(item.totalPrice || item.unitPrice),
      quantity: item.quantity || 1,
      size: item.isCustomFit ? undefined : "M",
    })),
    measurements,
  };
}
