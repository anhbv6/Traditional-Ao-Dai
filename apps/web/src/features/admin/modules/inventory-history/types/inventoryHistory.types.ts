/**
 * Loại biến động kho — gộp từ ba nguồn:
 * - SKU điều chỉnh tay (AuditLog INVENTORY_ADJUSTED): RECEIVED, RETURNED, SOLD_IN_STORE, DAMAGED, STOCKTAKE
 * - Đơn online trừ tồn (OrderItem): ONLINE_ORDER
 * - Cây vải (mock tạm): RESTOCK, CUT, WASTE, ADJUST
 */
export const STOCK_EVENT_KINDS = [
  "RECEIVED",
  "RETURNED",
  "RESTOCK",
  "SOLD_IN_STORE",
  "ONLINE_ORDER",
  "CUT",
  "DAMAGED",
  "WASTE",
  "STOCKTAKE",
  "ADJUST",
] as const;
export type StockEventKind = (typeof STOCK_EVENT_KINDS)[number];

/** Nhóm hướng biến động để lọc và tóm tắt kỳ */
export const STOCK_EVENT_DIRECTIONS = ["IN", "OUT", "LOSS", "COUNT"] as const;
export type StockEventDirection = (typeof STOCK_EVENT_DIRECTIONS)[number];

export type StockEventSubject = "SKU" | "FABRIC";
export type StockUnit = "PIECE" | "METER";

export interface StockEventLine {
  /** SKU hoặc mã cây vải */
  code: string;
  /** Màu · size (SKU) — null với cây vải */
  detail: string | null;
  hex: string | null;
  /** Null khi nguồn không ghi số trước / sau (đơn online) */
  from: number | null;
  to: number | null;
  delta: number;
}

export interface StockEvent {
  id: string;
  subject: StockEventSubject;
  kind: StockEventKind;
  /** Tên sản phẩm / cây vải */
  title: string;
  /** Mã sản phẩm / chất liệu */
  code: string;
  image: string | null;
  /** Màu của cây vải (để vẽ ô vải) */
  hex: string | null;
  unit: StockUnit;
  lines: StockEventLine[];
  delta: number;
  orderCode: string | null;
  /** Đơn online đã hủy / hoàn tiền — tồn hiện CHƯA được hoàn tự động */
  orderCancelled: boolean;
  note: string | null;
  actorName: string | null;
  /** Người thực hiện là khách đặt online (không phải nhân viên) */
  actorIsCustomer: boolean;
  createdAt: string;
  /** Ngày theo giờ tiệm (YYYY-MM-DD) — tính ở server để server và client gom giống nhau */
  dayKey: string;
  /** Liên kết tới đối tượng (sản phẩm / màn vải) */
  href: string | null;
}

export interface StockHistoryData {
  events: StockEvent[];
  todayKey: string;
  yesterdayKey: string;
  /** Số ngày tối đa đã tải */
  maxDays: number;
}
