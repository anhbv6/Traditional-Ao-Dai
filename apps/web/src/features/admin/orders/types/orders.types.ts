export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "READY_TO_SHIP"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";

export interface OrderItemSummary {
  id: string;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  isCustomFit: boolean;
  tailoringStatus: string;
}

export interface AdminOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  note?: string | null;
  subTotal: string | number;
  discountAmount: string | number;
  shippingFee: string | number;
  totalAmount: string | number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  items: OrderItemSummary[];
}

export interface OrderFilterParams {
  status?: OrderStatus | "ALL";
  paymentStatus?: PaymentStatus | "ALL";
  search?: string;
  page?: number;
  limit?: number;
}
