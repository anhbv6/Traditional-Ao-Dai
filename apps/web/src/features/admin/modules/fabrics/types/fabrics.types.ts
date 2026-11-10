/**
 * Loại biến động của một cây vải:
 * - CUT: cắt may cho đơn (trừ mét, có thể gắn mã đơn)
 * - RESTOCK: nhập thêm vào cây (cộng mét)
 * - WASTE: hao hụt — lỗi dệt, cắt hỏng, ố (trừ mét)
 * - ADJUST: kiểm kê — đo lại và đặt số mét thực tế
 */
export const FABRIC_MOVEMENT_TYPES = ["CUT", "RESTOCK", "WASTE", "ADJUST"] as const;
export type FabricMovementType = (typeof FABRIC_MOVEMENT_TYPES)[number];

/** Tình trạng cây vải — tính từ số mét còn lại so với ngưỡng, không lưu */
export type FabricStockStatus = "OK" | "LOW" | "OUT" | "INACTIVE";

export interface FabricMaterialOption {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  widthCm: number | null;
  /** Định mức mét cho một thân áo — null = chất liệu chưa có định mức */
  metersPerTop: number | null;
  metersPerPants: number | null;
}

export interface FabricColorOption {
  id: string;
  name: string;
  nameEn: string | null;
  hex: string;
}

export interface FabricProductOption {
  id: string;
  code: string;
  name: string;
  /** Mẫu áo đang hiện trên web */
  isVisible: boolean;
}

export interface FabricMovement {
  id: string;
  type: FabricMovementType;
  /** Số mét thay đổi (âm khi trừ) */
  delta: number;
  balanceAfter: number;
  orderCode: string | null;
  note: string | null;
  actorName: string;
  createdAt: string;
}

export interface AdminFabricRoll {
  id: string;
  code: string;
  name: string;
  materialId: string;
  colorId: string | null;
  /** Số mét lúc nhập cây — mốc để vẽ thanh còn lại */
  receivedMeters: number;
  remainingMeters: number;
  lowStockThreshold: number;
  isActive: boolean;
  productId: string | null;
  receivedAt: string;
  updatedAt: string;
  /** Biến động gần nhất, mới nhất trước */
  movements: FabricMovement[];
}

export interface AdminFabricStockData {
  rolls: AdminFabricRoll[];
  materials: FabricMaterialOption[];
  colors: FabricColorOption[];
  products: FabricProductOption[];
  /** Mốc "bây giờ" của server — để thời gian tương đối giống nhau ở server và client */
  now: string;
}

/** Dữ liệu nhập / sửa cây vải từ dialog */
export interface FabricRollInput {
  materialId: string;
  colorId: string;
  name: string;
  code: string;
  receivedMeters: number;
  lowStockThreshold: number;
  productId: string | null;
}

/** Dữ liệu ghi một biến động từ dialog */
export interface FabricMovementInput {
  type: FabricMovementType;
  /** CUT / RESTOCK / WASTE: số mét thay đổi (dương); ADJUST: số mét đo thực tế */
  meters: number;
  orderCode: string | null;
  note: string | null;
}
