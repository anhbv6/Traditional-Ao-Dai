import { type OrderStatus as DbOrderStatus } from "@repo/db";

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
