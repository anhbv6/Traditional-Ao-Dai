/**
 * Hợp đồng đơn hàng dùng chung FE ↔ BE: mã đơn, phương thức thanh toán / tiền cọc, các bước tiến độ may,
 * bộ lọc "Đơn hàng của tôi" và kiểu dữ liệu trả về. Chỉ code thuần — server luôn tự tính lại tiền.
 */

// ─── Mã đơn ─────────────────────────────────────────────────────────────────────

/** Bảng ký tự đuôi mã đơn — bỏ I, O, 0, 1 để khách đọc / gõ không nhầm */
export const ORDER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const ORDER_CODE_SUFFIX_LENGTH = 4
/** Mã đơn công khai: TC-YYMM-XXXX (đuôi ngẫu nhiên, không tuần tự) */
export const ORDER_CODE_REGEX = /^TC-\d{4}-[A-Z0-9]{4}$/

/** Chuẩn hóa mã khách gõ: bỏ khoảng trắng, in hoa (" tc-2611-ab7k " → "TC-2611-AB7K") */
export function normalizeOrderCode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

/** Nội dung chuyển khoản để đối soát — chỉ chữ không dấu (ngân hàng bỏ dấu) */
export function buildTransferContent(orderCode: string): string {
  return `THIENCANH ${orderCode}`
}

// ─── Thanh toán ─────────────────────────────────────────────────────────────────

/**
 * - COD: trả toàn bộ khi nhận hàng (chỉ đơn may sẵn)
 * - BANK_TRANSFER: chuyển khoản 100% qua VietQR
 * - DEPOSIT: chuyển khoản cọc 30–50%, phần còn lại COD
 */
export const PAYMENT_METHODS = ['COD', 'BANK_TRANSFER', 'DEPOSIT'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const DEPOSIT_PERCENT_MIN = 30
export const DEPOSIT_PERCENT_MAX = 50
export const DEPOSIT_PERCENT_DEFAULT = 30
/** Phí giao hàng tiêu chuẩn (VND) — server dùng giá trị này khi tính lại đơn */
export const STANDARD_SHIPPING_FEE = 30_000

/** Đơn may đo không được COD 100%: phải cọc hoặc chuyển khoản toàn bộ */
export function isPaymentMethodAllowed(method: PaymentMethod, isTailored: boolean): boolean {
  return !(isTailored && method === 'COD')
}

/**
 * Số tiền khách phải chuyển khoản trước (VND, làm tròn LÊN tới nghìn đồng với tiền cọc).
 * Phần trăm cọc ngoài khoảng 30–50% bị ép về biên.
 */
export function computePrepayAmount(total: number, method: PaymentMethod, depositPercent = DEPOSIT_PERCENT_DEFAULT): number {
  if (method === 'COD') return 0
  if (method === 'BANK_TRANSFER') return total
  const percent = Math.min(DEPOSIT_PERCENT_MAX, Math.max(DEPOSIT_PERCENT_MIN, Math.round(depositPercent)))
  return Math.min(total, Math.ceil((total * percent) / 100 / 1000) * 1000)
}

// ─── Trạng thái & tiến độ may ───────────────────────────────────────────────────

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'IN_PRODUCTION',
  'READY_TO_SHIP',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const TAILORING_STATUSES = [
  'NOT_APPLICABLE',
  'WAITING_FABRIC',
  'FABRIC_CUTTING',
  'SEWING',
  'EMBROIDERY_BEADING',
  'FITTING_IRONING',
  'COMPLETED',
] as const
export type TailoringStatus = (typeof TAILORING_STATUSES)[number]

/** 5 bước khách nhìn thấy: nhận số đo → cắt vải → may → kiểm tra cuối → giao hàng */
export const TRACKING_STEPS = ['MEASUREMENTS_RECEIVED', 'FABRIC_CUTTING', 'SEWING', 'FINAL_CHECK', 'SHIPPING'] as const
export type TrackingStep = (typeof TRACKING_STEPS)[number]

/** Trạng thái xưởng → chỉ số bước (thêu / đính kết vẫn thuộc bước "may") */
const TAILORING_STEP_INDEX: Record<TailoringStatus, number> = {
  NOT_APPLICABLE: 0,
  WAITING_FABRIC: 0,
  FABRIC_CUTTING: 1,
  SEWING: 2,
  EMBROIDERY_BEADING: 2,
  FITTING_IRONING: 3,
  COMPLETED: 3,
}

export function tailoringStepIndex(status: TailoringStatus): number {
  return TAILORING_STEP_INDEX[status]
}

export interface TrackingProgress {
  /** Bước đang diễn ra (0–4); bằng TRACKING_STEPS.length khi đã giao xong */
  currentStep: number
  state: 'ACTIVE' | 'DONE' | 'CANCELLED'
}

/**
 * Tiến độ đơn = bước của món chậm nhất trong các món may đo, rồi nâng lên theo trạng thái đơn
 * (đóng gói xong → kiểm tra cuối đã qua, đang giao → bước giao hàng, đã giao → hoàn tất).
 */
export function resolveTrackingProgress(orderStatus: OrderStatus, itemStatuses: TailoringStatus[]): TrackingProgress {
  if (orderStatus === 'CANCELLED' || orderStatus === 'REFUNDED') {
    const step = itemStatuses.length ? Math.min(...itemStatuses.map(tailoringStepIndex)) : 0
    return { currentStep: step, state: 'CANCELLED' }
  }
  if (orderStatus === 'DELIVERED') return { currentStep: TRACKING_STEPS.length, state: 'DONE' }
  if (orderStatus === 'SHIPPING' || orderStatus === 'READY_TO_SHIP') return { currentStep: 4, state: 'ACTIVE' }

  const tailored = itemStatuses.filter((status) => status !== 'NOT_APPLICABLE')
  const step = tailored.length ? Math.min(...tailored.map(tailoringStepIndex)) : 0
  return { currentStep: step, state: 'ACTIVE' }
}

// ─── "Đơn hàng của tôi" ─────────────────────────────────────────────────────────

/** Bộ lọc màn đơn hàng: tất cả / chờ thanh toán / đang xử lý / đang may / đang giao / hoàn tất / đã hủy */
export const CUSTOMER_ORDER_FILTERS = [
  'ALL',
  'AWAITING_PAYMENT',
  'PROCESSING',
  'TAILORING',
  'SHIPPING',
  'COMPLETED',
  'CANCELLED',
] as const
export type CustomerOrderFilter = (typeof CUSTOMER_ORDER_FILTERS)[number]
export type CustomerOrderStage = Exclude<CustomerOrderFilter, 'ALL'>

/** Nhóm hiển thị của một đơn — cùng luật với bộ lọc phía server */
export function resolveCustomerOrderStage(order: {
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  isTailored: boolean
}): CustomerOrderStage {
  const { orderStatus } = order
  if (orderStatus === 'CANCELLED' || orderStatus === 'REFUNDED') return 'CANCELLED'
  if (orderStatus === 'DELIVERED') return 'COMPLETED'
  if (orderStatus === 'SHIPPING' || orderStatus === 'READY_TO_SHIP') return 'SHIPPING'
  if (orderStatus === 'PENDING' && order.paymentMethod !== 'COD' && order.paymentStatus === 'UNPAID') return 'AWAITING_PAYMENT'
  if (order.isTailored && (orderStatus === 'IN_PRODUCTION' || orderStatus === 'CONFIRMED')) return 'TAILORING'
  return 'PROCESSING'
}

// ─── Số đo trên đơn ─────────────────────────────────────────────────────────────

/** Các số đo lưu snapshot trên OrderItem (tập con của MEASUREMENT_KEYS) */
export const ORDER_MEASUREMENT_KEYS = [
  'height',
  'weight',
  'bust',
  'waist',
  'hips',
  'shoulder',
  'armLength',
  'armpit',
  'neck',
  'shirtLength',
  'pantsLength',
  'thigh',
] as const
export type OrderMeasurementKey = (typeof ORDER_MEASUREMENT_KEYS)[number]
export type OrderMeasurements = Partial<Record<OrderMeasurementKey, number>>

// ─── Kiểu dữ liệu API ───────────────────────────────────────────────────────────

/** Địa chỉ giao hàng dạng cấu trúc (lưu ở Order.shippingDetail) */
export interface ShippingDetail {
  province: string
  district: string
  ward: string
  addressLine: string
}

/** Hướng dẫn chuyển khoản VietQR — chỉ có khi còn số tiền phải chuyển trước */
export interface PaymentInstructionDto {
  bankBin: string
  bankName: string
  accountNumber: string
  accountName: string
  amount: number
  transferContent: string
  qrImageUrl: string
}

export interface OrderAmountsDto {
  subTotal: number
  discountAmount: number
  shippingFee: number
  totalAmount: number
  /** Số phải chuyển khoản trước (cọc hoặc toàn bộ) */
  prepayAmount: number
  paidAmount: number
  /** Còn phải trả = tổng − đã trả */
  balanceDue: number
}

export interface OrderItemDto {
  id: string
  productName: string
  variantName: string | null
  image: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  isCustomFit: boolean
  tailoringStatus: TailoringStatus
}

/** Kết quả tra cứu bằng mã đơn + SĐT/email (cơ chế A) — tối giản, không lộ địa chỉ / số đo */
export interface OrderLookupDto {
  orderCode: string
  createdAt: string
  orderStatus: OrderStatus
  isTailored: boolean
  dueDate: string | null
  progress: TrackingProgress
  items: Pick<OrderItemDto, 'productName' | 'variantName' | 'quantity' | 'isCustomFit'>[]
}

export interface TrackingEventDto {
  id: string
  step: TrackingStep
  status: TailoringStatus
  note: string | null
  images: string[]
  createdAt: string
  /** Tên món (đơn nhiều món may đo) */
  itemName: string | null
}

export interface FittingAppointmentDto {
  id: string
  type: 'MEASUREMENT' | 'FITTING' | 'PICKUP'
  status: 'SCHEDULED' | 'DONE' | 'CANCELLED' | 'NO_SHOW'
  scheduledAt: string
}

export interface OrderTrackedItemDto extends OrderItemDto {
  measurements: OrderMeasurements
  customNote: string | null
  /** Còn sửa số đo được (chưa cắt vải) */
  canEditMeasurements: boolean
}

/** Timeline đầy đủ (magic link / khách đã đăng nhập) */
export interface OrderTimelineDto {
  orderCode: string
  createdAt: string
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  isTailored: boolean
  dueDate: string | null
  progress: TrackingProgress
  /** Mốc thời gian của từng bước (ISO) — null khi chưa tới */
  stepDates: (string | null)[]
  customerName: string
  /** SĐT đã che (09•••••678) — nơi nhận OTP */
  maskedPhone: string
  shippingAddress: string
  shippingDetail: ShippingDetail | null
  canEditAddress: boolean
  items: OrderTrackedItemDto[]
  events: TrackingEventDto[]
  appointments: FittingAppointmentDto[]
  amounts: OrderAmountsDto
  payment: PaymentInstructionDto | null
  /** Đơn chưa gắn tài khoản → trang cảm ơn mời tạo tài khoản */
  isGuestOrder: boolean
}

export interface CustomerOrderSummaryDto {
  orderCode: string
  createdAt: string
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  stage: CustomerOrderStage
  isTailored: boolean
  itemCount: number
  previewImages: string[]
  firstItemName: string
  amounts: OrderAmountsDto
}

/** Kết quả đặt hàng — `accessToken` là token gốc của link tra cứu (chỉ trả MỘT lần) */
export interface PlaceOrderResultDto {
  orderCode: string
  accessToken: string
}
