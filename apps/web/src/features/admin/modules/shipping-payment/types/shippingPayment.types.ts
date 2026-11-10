import { type PaymentMethod } from "@repo/shared/orders";

/** Vùng giao hàng: nhóm tỉnh / thành cùng mức phí và thời gian giao */
export interface ShippingZone {
  id: string;
  name: string;
  /** Mã tỉnh (địa giới mới từ 07/2025 — 34 tỉnh / thành) */
  provinceCodes: string[];
  /** Phí món đầu tiên */
  baseFee: number;
  /** Cộng thêm cho mỗi món từ món thứ hai (áo dài gấp nặng, hộp to) */
  extraItemFee: number;
  /** Số ngày giao sau khi đóng gói xong */
  etaMinDays: number;
  etaMaxDays: number;
  /** Đơn vị giao mặc định của vùng */
  carrierId: string;
  /** Vùng này có được miễn phí giao theo ngưỡng chung không (vùng xa thường không) */
  freeShipEligible: boolean;
}

export type CarrierKind = "COURIER" | "SHOP_DELIVERY" | "PICKUP";

export interface Carrier {
  id: string;
  name: string;
  kind: CarrierKind;
  isActive: boolean;
  /** Ghi chú nội bộ: giờ lấy hàng, đầu mối… */
  note: string;
}

export interface FreeShippingRule {
  enabled: boolean;
  /** Đơn từ mức này (tạm tính sau giảm giá) được miễn phí */
  threshold: number;
  /** Đơn có áo may đo luôn miễn phí giao (giá trị cao, giao một lần) */
  tailoredAlwaysFree: boolean;
}

export interface FulfillmentRule {
  /** Số ngày chuẩn bị hàng may sẵn trước khi giao */
  prepDays: number;
  /** Đặt trước giờ này (giờ tiệm) thì tính chuẩn bị từ hôm nay */
  cutoffTime: string;
  giftWrapEnabled: boolean;
  giftWrapFee: number;
  /** Tạm ngưng giao (Tết…) — null = không ngưng */
  pause: { from: string; to: string; message: string } | null;
}

export interface PaymentMethodConfig {
  method: PaymentMethod;
  enabled: boolean;
  /** Ghi chú khách thấy dưới tên phương thức ở trang thanh toán */
  customerNote: string;
}

export interface CodRule {
  /** Đơn vượt mức này không được COD (rủi ro boom hàng) — null = không giới hạn */
  maxOrderValue: number | null;
  /** Chỉ COD cho khách có tài khoản đã xác minh SĐT */
  verifiedPhoneOnly: boolean;
}

export interface DepositRule {
  /** % cọc mặc định, trong khoảng DEPOSIT_PERCENT_MIN–MAX */
  percent: number;
  /** Đơn may sẵn từ mức này cũng phải cọc thay vì COD — null = không áp */
  requiredAbove: number | null;
}

export interface BankAccount {
  bankBin: string;
  bankName: string;
  accountNumber: string;
  /** In hoa, không dấu — đúng như tên in trên app ngân hàng của khách */
  accountName: string;
  branch: string;
}

export interface PaymentDeadline {
  /** Nhắc khách sau N giờ chưa chuyển khoản */
  remindAfterHours: number;
  /** Tự hủy đơn chưa nhận tiền sau N giờ — null = không tự hủy */
  autoCancelAfterHours: number | null;
}

export interface ShippingPaymentSettings {
  zones: ShippingZone[];
  carriers: Carrier[];
  freeShipping: FreeShippingRule;
  fulfillment: FulfillmentRule;
  methods: PaymentMethodConfig[];
  cod: CodRule;
  deposit: DepositRule;
  bank: BankAccount;
  deadline: PaymentDeadline;
}

export interface Province {
  code: string;
  name: string;
  /** Miền — để gom nhanh khi chọn tỉnh cho vùng */
  region: "NORTH" | "CENTRAL" | "SOUTH";
}

export interface ShippingPaymentData {
  settings: ShippingPaymentSettings;
  provinces: Province[];
  /** Ngân hàng phổ biến (BIN theo NAPAS) để chọn nhanh */
  banks: { bin: string; name: string }[];
  updatedAt: string;
  updatedBy: string;
  now: string;
}
