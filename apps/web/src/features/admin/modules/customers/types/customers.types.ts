import { type OrderStatus } from "@repo/shared/orders";

/** Thông số số đo hiển thị (cm / kg) — khớp các cột của UserMeasurement */
export const CUSTOMER_MEASUREMENT_KEYS = [
  "height",
  "weight",
  "bust",
  "waist",
  "hips",
  "shoulder",
  "armLength",
  "armpit",
  "neck",
  "shirtLength",
  "pantsLength",
  "thigh",
] as const;
export type CustomerMeasurementKey = (typeof CUSTOMER_MEASUREMENT_KEYS)[number];

export interface CustomerMeasurementProfile {
  id: string;
  profileName: string;
  isDefault: boolean;
  values: Partial<Record<CustomerMeasurementKey, number>>;
  note: string | null;
  updatedAt: string;
}

/** Số liệu mua hàng gộp từ các đơn (tiền là số nguyên VND) */
export interface CustomerStats {
  ordersCount: number;
  /** Đơn còn hiệu lực (không hủy / hoàn) */
  activeOrders: number;
  /** Tiền đã thu thật (paidAmount) của các đơn không hoàn tiền */
  spent: number;
  /** Còn phải thu của đơn chưa đóng */
  outstanding: number;
  lastOrderAt: string | null;
}

/** Một dòng danh sách — khách có tài khoản hoặc khách vãng lai (gom đơn theo SĐT) */
export interface AdminCustomerRow extends CustomerStats {
  /** id tài khoản; khách vãng lai dùng "guest:<SĐT>" */
  id: string;
  kind: "ACCOUNT" | "GUEST";
  name: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  avatarUrl: string | null;
  status: "ACTIVE" | "LOCKED";
  measurementCount: number;
  createdAt: string;
  /** Đơn gần nhất (để khách vãng lai mở thẳng đơn) */
  lastOrderId: string | null;
}

export interface AdminCustomersData {
  customers: AdminCustomerRow[];
  canToggleActive: boolean;
  now: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  isTailored: boolean;
  itemCount: number;
  firstItemName: string;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  receiverName: string;
  receiverPhone: string;
  line: string;
  isDefault: boolean;
}

export interface AdminCustomerDetail extends AdminCustomerRow {
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  birthDate: string | null;
  lastLoginAt: string | null;
  lockedAt: string | null;
  lockedReason: string | null;
  hasGoogle: boolean;
  orders: CustomerOrderSummary[];
  measurements: CustomerMeasurementProfile[];
  addresses: CustomerAddress[];
  canToggleActive: boolean;
  now: string;
}
