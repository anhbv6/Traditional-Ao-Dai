import { type BespokeConfig } from "@repo/shared/bespoke";
import { type OrderMeasurements } from "@repo/shared/orders";

/**
 * Một dòng trong giỏ hàng. Tiền tệ: số nguyên VND (định dạng bằng `formatVnd` từ @repo/shared khi hiển thị).
 */
export interface CartItem {
  /** Khóa dòng = slug + size + màu (+ số đo nếu may đo): cùng biến thể thì cộng dồn số lượng */
  id: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  /** Tên màu đã chọn (không có khi thêm nhanh từ thẻ sản phẩm) */
  color?: string;
  /** Số đo may đo (cm), khóa là nhãn số đo đã dịch (VD: "Vòng ngực") — chỉ có với size may đo */
  measurements?: Record<string, string>;
  /** Số đo dạng cấu trúc gửi lên API khi đặt hàng (khóa = ORDER_MEASUREMENT_KEYS) */
  measurementValues?: OrderMeasurements;
  /** Cấu hình áo dài thiết kế riêng — API báo giá lại từ cấu hình này, không tin `price` */
  bespoke?: BespokeConfig;
  /** Đơn giá VND (số nguyên) */
  price: number;
  /** Giá gốc VND trước khuyến mãi (nếu có) — chỉ để hiển thị */
  originalPrice?: number;
  /** Trang mở khi bấm vào dòng — mặc định `/products/<slug>`; áo dài thiết kế riêng trỏ về `/custom` */
  href?: string;
  quantity: number;
}

export type NewCartItem = Omit<CartItem, "id" | "quantity"> & { quantity?: number };

export interface ActiveDiscount {
  code: string;
  type: "percentage" | "freeship";
  value: number;
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  /** Tiết kiệm nhờ giá khuyến mãi so với giá gốc (chỉ để hiển thị) */
  savings: number;
  total: number;
  totalQuantity: number;
}
