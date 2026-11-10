/** Công đoạn xưởng (khớp enum TailoringStatus của Prisma) */
export type TailoringStatus =
  | "NOT_APPLICABLE"
  | "WAITING_FABRIC"
  | "FABRIC_CUTTING"
  | "SEWING"
  | "EMBROIDERY_BEADING"
  | "FITTING_IRONING"
  | "COMPLETED";

/** 6 công đoạn của dây chuyền theo thứ tự (bỏ NOT_APPLICABLE của hàng may sẵn) */
export const TAILORING_STAGES = [
  "WAITING_FABRIC",
  "FABRIC_CUTTING",
  "SEWING",
  "EMBROIDERY_BEADING",
  "FITTING_IRONING",
  "COMPLETED",
] as const;
export type TailoringStage = (typeof TAILORING_STAGES)[number];

export type TailoringOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "READY_TO_SHIP"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type TailoringPaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";

export interface TailoringLogEntry {
  id: string;
  orderItemId: string | null;
  status: TailoringStatus;
  note: string | null;
  images: string[];
  staffName: string | null;
  createdAt: string;
}

/** Số đo snapshot lúc đặt (cm / kg) — null = khách không nhập */
export const TAILORING_MEASUREMENT_KEYS = [
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
export type TailoringMeasurementKey = (typeof TAILORING_MEASUREMENT_KEYS)[number];

export interface TailoringItem {
  id: string;
  productId: string;
  productName: string;
  variantName: string | null;
  image: string | null;
  materialName: string | null;
  quantity: number;
  status: TailoringStage;
  /** Số ngày may dự kiến của mẫu — để ước lượng còn kịp hẹn không */
  leadTimeDays: number;
  measurements: Partial<Record<TailoringMeasurementKey, number>>;
  customNote: string | null;
  /** Lần cập nhật công đoạn gần nhất (hoặc ngày đặt nếu chưa có) — để biết món đứng yên bao lâu */
  stageSince: string;
  lastLog: TailoringLogEntry | null;
}

export interface TailoringOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderStatus: TailoringOrderStatus;
  paymentStatus: TailoringPaymentStatus;
  totalAmount: number;
  paidAmount: number;
  depositAmount: number;
  dueDate: string | null;
  createdAt: string;
  note: string | null;
  items: TailoringItem[];
  /** Món may sẵn đi kèm cùng đơn (giao chung) */
  readyMadeCount: number;
}

export interface TailoringBoardData {
  orders: TailoringOrder[];
  /** Ngày hôm nay theo giờ tiệm (YYYY-MM-DD) — tính ở server */
  todayKey: string;
  now: string;
}

export interface TailoringOrderDetailData extends TailoringOrder {
  customerEmail: string;
  shippingAddress: string;
  logs: TailoringLogEntry[];
  todayKey: string;
  now: string;
}

/** Kết quả một lần chuyển công đoạn — để cập nhật giao diện tại chỗ */
export interface MoveStageResult {
  itemId: string;
  stage: TailoringStage;
  note: string | null;
  logId: string;
  createdAt: string;
  staffName: string | null;
}
