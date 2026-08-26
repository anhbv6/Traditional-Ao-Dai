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
