import { type OrderStatus, type PaymentMethod, type PaymentStatus, type TailoringStatus } from "@repo/shared/orders";

export type { OrderStatus, PaymentStatus };

/** Tab vòng đời đơn trên màn danh sách */
export const ORDER_TABS = ["ALL", "PENDING", "PROCESSING", "READY_TO_SHIP", "SHIPPING", "DELIVERED", "CLOSED"] as const;
export type OrderTab = (typeof ORDER_TABS)[number];

export interface AdminOrderLine {
  id: string;
  productId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  image: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isCustomFit: boolean;
  tailoringStatus: TailoringStatus;
}

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  /** COD / BANK_TRANSFER / DEPOSIT (chuỗi lạ từ dữ liệu cũ giữ nguyên) */
  paymentMethod: PaymentMethod | string;
  totalAmount: number;
  paidAmount: number;
  depositAmount: number;
  isTailored: boolean;
  dueDate: string | null;
  createdAt: string;
  /** Tên món đầu + số món còn lại — đủ cho dòng danh sách */
  firstItemName: string;
  itemCount: number;
  /** Công đoạn chậm nhất của các món may đo (null nếu không có món may đo) */
  slowestTailoring: TailoringStatus | null;
  /** Đang có yêu cầu hủy / hoàn tiền chờ duyệt */
  pendingApproval: "CANCEL_ORDER" | "REFUND" | "MANUAL_DISCOUNT" | null;
}

export interface AdminOrdersData {
  orders: AdminOrderRow[];
  now: string;
}

export interface AdminOrderDetail extends AdminOrderRow {
  customerEmail: string;
  shippingAddress: string;
  note: string | null;
  subTotal: number;
  discountAmount: number;
  shippingFee: number;
  createdByName: string | null;
  updatedAt: string;
  lines: AdminOrderLine[];
  now: string;
}

/** Thay đổi áp tại chỗ sau một thao tác thành công (danh sách / chi tiết tự áp vào state của mình) */
export type OrderPatch =
  | { orderId: string; orderStatus: OrderStatus }
  | { orderId: string; paidAmount: number; paymentStatus: PaymentStatus }
  | { orderId: string; pendingApproval: "CANCEL_ORDER" };
