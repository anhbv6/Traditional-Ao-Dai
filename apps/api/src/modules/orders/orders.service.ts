import { randomBytes, randomInt } from 'crypto'
import { prisma, Prisma } from '@repo/db'
import { normalizeEmail, normalizeVietnamPhone, toVnd } from '@repo/shared'
import {
  BESPOKE_PRODUCT_SLUG,
  quoteBespoke,
  type BespokeConfig,
} from '@repo/shared/bespoke'
import {
  ORDER_CODE_ALPHABET,
  ORDER_CODE_SUFFIX_LENGTH,
  ORDER_MEASUREMENT_KEYS,
  STANDARD_SHIPPING_FEE,
  TRACKING_STEPS,
  buildTransferContent,
  computePrepayAmount,
  isPaymentMethodAllowed,
  resolveCustomerOrderStage,
  resolveTrackingProgress,
  tailoringStepIndex,
  type CustomerOrderSummaryDto,
  type OrderAmountsDto,
  type OrderLookupDto,
  type OrderMeasurements,
  type OrderTimelineDto,
  type PaymentInstructionDto,
  type PaymentMethod,
  type PlaceOrderResultDto,
  type ShippingDetail,
} from '@repo/shared/orders'
import { env } from '../../config/env'
import { redis } from '../../infra/redis'
import { mailProvider } from '../../infra/mailer'
import { smsProvider } from '../../infra/sms'
import { AppError } from '../../core/http/AppError'
import { hashToken } from '../../core/security/session'
import { createOrderAccessToken, resolveOrderAccessToken } from '../../core/security/orderAccess'
import { deliverOtp, verifyOtp, type SendOtpResult } from '../otp/otp.service'
import {
  type ListMyOrdersQuery,
  type LookupOrderInput,
  type OrderLineInput,
  type OrderMeasurementsInput,
  type PlaceOrderInput,
  type ShippingInput,
  type UpdateOrderAddressInput,
  type UpdateOrderMeasurementsInput,
} from './orders.schema'

/** Transaction đặt hàng (trừ kho + đơn + dòng + token) — nới hạn mặc định 5 giây cho DB từ xa */
const PLACE_ORDER_TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 }

/** Phiên sửa đơn sau khi nhập đúng OTP */
const EDIT_GRANT_TTL_SECONDS = 15 * 60

/** Trạng thái đơn còn sửa được địa chỉ (chưa giao cho đơn vị vận chuyển) */
const ADDRESS_EDITABLE_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY_TO_SHIP'] as const
/** Số đo chỉ sửa được khi xưởng chưa cắt vải */
const MEASUREMENT_EDITABLE_ORDER_STATUSES = ['PENDING', 'CONFIRMED'] as const
const MEASUREMENT_EDITABLE_TAILORING = ['WAITING_FABRIC', 'NOT_APPLICABLE'] as const

// ─── Tiện ích ──────────────────────────────────────────────────────────────────

/** TC-YYMM-XXXX: đuôi lấy ngẫu nhiên bằng CSPRNG → không suy ra được mã đơn khác */
function generateOrderCode(now = new Date()): string {
  const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`
  let suffix = ''
  for (let i = 0; i < ORDER_CODE_SUFFIX_LENGTH; i++) {
    suffix += ORDER_CODE_ALPHABET[randomInt(0, ORDER_CODE_ALPHABET.length)]
  }
  return `TC-${yymm}-${suffix}`
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return '•'.repeat(phone.length)
  return `${phone.slice(0, 2)}${'•'.repeat(phone.length - 5)}${phone.slice(-3)}`
}

function formatAddress(detail: ShippingInput): string {
  return [detail.addressLine, detail.ward, detail.district, detail.province].join(', ')
}

function readShippingDetail(value: Prisma.JsonValue | null): ShippingDetail | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const { province, district, ward, addressLine } = value as Record<string, unknown>
  if ([province, district, ward, addressLine].every((part) => typeof part === 'string')) {
    return { province, district, ward, addressLine } as ShippingDetail
  }
  return null
}

function pickMeasurements(source: Partial<Record<(typeof ORDER_MEASUREMENT_KEYS)[number], number | null>>): OrderMeasurements {
  const result: OrderMeasurements = {}
  for (const key of ORDER_MEASUREMENT_KEYS) {
    const value = source[key]
    if (typeof value === 'number') result[key] = value
  }
  return result
}

/** Cột số đo của OrderItem (null cho số đo không nhập) */
function measurementColumns(input: OrderMeasurementsInput | undefined) {
  return Object.fromEntries(ORDER_MEASUREMENT_KEYS.map((key) => [key, input?.[key] ?? null])) as Record<
    (typeof ORDER_MEASUREMENT_KEYS)[number],
    number | null
  >
}

function buildPaymentInstruction(orderCode: string, amount: number): PaymentInstructionDto {
  const transferContent = buildTransferContent(orderCode)
  const params = new URLSearchParams({ amount: String(amount), addInfo: transferContent, accountName: env.BANK_ACCOUNT_NAME })
  return {
    bankBin: env.BANK_BIN,
    bankName: env.BANK_NAME,
    accountNumber: env.BANK_ACCOUNT_NUMBER,
    accountName: env.BANK_ACCOUNT_NAME,
    amount,
    transferContent,
    // Ảnh QR động của VietQR: app ngân hàng quét là điền sẵn số tiền + nội dung
    qrImageUrl: `https://img.vietqr.io/image/${env.BANK_BIN}-${env.BANK_ACCOUNT_NUMBER}-compact2.png?${params.toString()}`,
  }
}

type AmountSource = {
  subTotal: Prisma.Decimal
  discountAmount: Prisma.Decimal
  shippingFee: Prisma.Decimal
  totalAmount: Prisma.Decimal
  depositAmount: Prisma.Decimal
  paidAmount: Prisma.Decimal
}

function toAmounts(order: AmountSource): OrderAmountsDto {
  const totalAmount = toVnd(order.totalAmount)
  const paidAmount = toVnd(order.paidAmount)
  return {
    subTotal: toVnd(order.subTotal),
    discountAmount: toVnd(order.discountAmount),
    shippingFee: toVnd(order.shippingFee),
    totalAmount,
    prepayAmount: toVnd(order.depositAmount),
    paidAmount,
    balanceDue: Math.max(0, totalAmount - paidAmount),
  }
}

/** Còn phải chuyển khoản trước bao nhiêu (0 khi đã đủ / đơn hủy / COD) */
function outstandingPrepay(order: AmountSource & { orderStatus: string }): number {
  if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'REFUNDED') return 0
  return Math.max(0, toVnd(order.depositAmount) - toVnd(order.paidAmount))
}

function asPaymentMethod(value: string): PaymentMethod {
  return value === 'BANK_TRANSFER' || value === 'DEPOSIT' ? value : 'COD'
}

// ─── Đặt hàng ──────────────────────────────────────────────────────────────────

type ResolvedLine = {
  productId: string
  variantId: string | null
  productName: string
  variantName: string | null
  sku: string | null
  quantity: number
  unitPrice: number
  isCustomFit: boolean
  measurements: OrderMeasurementsInput | undefined
  customNote: string | null
  leadTimeDays: number
}

function describeBespoke(config: BespokeConfig): string {
  const size = config.measureMode === 'standard' ? `size ${config.size}` : config.measureMode === 'custom' ? 'số đo riêng' : 'đo tại tiệm'
  return [config.style, config.fabric, config.color, config.decoration, config.pants, size, config.timeline].join(' · ')
}

/**
 * Tính lại từng dòng từ DB — KHÔNG dùng giá / tên client gửi. Sản phẩm không có trong DB (dữ liệu mock storefront)
 * → ORDER_ITEM_UNAVAILABLE.
 */
async function resolveLines(lines: OrderLineInput[]): Promise<ResolvedLine[]> {
  const slugs = [...new Set(lines.map((line) => (line.bespoke ? BESPOKE_PRODUCT_SLUG : line.productSlug)))]
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    include: { variants: true },
  })
  const bySlug = new Map(products.map((product) => [product.slug, product]))

  return lines.map((line) => {
    const product = bySlug.get(line.bespoke ? BESPOKE_PRODUCT_SLUG : line.productSlug)
    if (!product) throw new AppError(400, 'ORDER_ITEM_UNAVAILABLE')

    if (line.bespoke) {
      const config = line.bespoke
      if (config.measureMode === 'custom' && !line.measurements) throw new AppError(400, 'MEASUREMENT_REQUIRED')
      const quote = quoteBespoke(config)
      return {
        productId: product.id,
        variantId: null,
        productName: product.name,
        variantName: describeBespoke(config),
        sku: null,
        quantity: line.quantity,
        unitPrice: quote.total,
        isCustomFit: true,
        measurements: config.measureMode === 'custom' ? line.measurements : undefined,
        customNote: line.customNote ?? null,
        leadTimeDays: quote.maxDays,
      }
    }

    const wantsCustomFit = Boolean(line.measurements) || product.saleMode === 'CUSTOM'
    if (wantsCustomFit && !product.isCustomFit && product.saleMode !== 'CUSTOM') {
      throw new AppError(400, 'ORDER_ITEM_NOT_CUSTOMIZABLE')
    }

    const variant = wantsCustomFit
      ? (product.variants.find((item) => item.size === 'CUSTOM') ?? null)
      : (product.variants.find((item) => item.size === line.size && (!line.color || item.color === line.color)) ??
        (product.variants.length === 0 ? null : undefined))
    if (variant === undefined) throw new AppError(400, 'ORDER_ITEM_UNAVAILABLE')
    if (!wantsCustomFit && variant && variant.stock < line.quantity) throw new AppError(409, 'ORDER_ITEM_OUT_OF_STOCK')

    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name,
      variantName: wantsCustomFit ? 'May đo' : [variant?.color, variant?.size].filter(Boolean).join(' / ') || null,
      sku: variant?.sku ?? null,
      quantity: line.quantity,
      unitPrice: toVnd(variant?.price ?? product.basePrice),
      isCustomFit: wantsCustomFit,
      measurements: wantsCustomFit ? line.measurements : undefined,
      customNote: line.customNote ?? null,
      leadTimeDays: product.leadTimeDays ?? 10,
    }
  })
}

/**
 * Gửi link tra cứu qua email + SMS (dev: mock in ra console). Lỗi gửi không làm hỏng đơn đã tạo.
 */
async function notifyOrderPlaced(params: { orderCode: string; email: string; phone: string; token: string; locale: string }) {
  const link = `${env.FRONTEND_URL.replace(/\/$/, '')}/${params.locale}/orders/track?token=${params.token}`
  try {
    await mailProvider.sendMail({
      to: params.email,
      subject: `Thiên Canh — đơn ${params.orderCode}`,
      text: `Cảm ơn bạn đã đặt áo ở Thiên Canh. Mã đơn: ${params.orderCode}. Theo dõi tiến độ: ${link}`,
      html: `<div style="font-family: Georgia, serif; color: #2b1d1d; padding: 20px">
        <h2>Cảm ơn bạn đã gửi gắm tà áo cho Thiên Canh</h2>
        <p>Mã đơn của bạn: <strong>${params.orderCode}</strong></p>
        <p><a href="${link}">Theo dõi tiến độ may</a> — link chỉ để xem; muốn sửa số đo hay địa chỉ, tiệm sẽ gửi mã xác minh tới số điện thoại của đơn.</p>
      </div>`,
    })
    await smsProvider.sendSms(params.phone, `THIENCANH: don ${params.orderCode} da duoc ghi nhan. Theo doi: ${link}`)
  } catch (error) {
    console.error('[Orders] Gửi thông báo đơn thất bại:', error instanceof Error ? error.message : error)
  }
}

/**
 * Tạo đơn (khách vãng lai hoặc đã đăng nhập). Server tính lại toàn bộ tiền; đơn may đo bắt buộc cọc / chuyển khoản.
 * Trả mã đơn + token gốc của link tra cứu (chỉ trả MỘT lần).
 */
export async function placeOrder(input: PlaceOrderInput, userId?: string): Promise<PlaceOrderResultDto> {
  const lines = await resolveLines(input.items)
  const isTailored = lines.some((line) => line.isCustomFit)

  if (!isPaymentMethodAllowed(input.paymentMethod, isTailored)) {
    throw new AppError(400, 'ORDER_TAILORED_REQUIRES_DEPOSIT')
  }
  if (input.paymentMethod === 'DEPOSIT' && !isTailored) {
    throw new AppError(400, 'ORDER_PAYMENT_METHOD_INVALID')
  }

  const subTotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  const shippingFee = STANDARD_SHIPPING_FEE
  // Mã giảm giá demo phía client KHÔNG được áp: voucher chỉ có hiệu lực khi có API voucher
  const totalAmount = subTotal + shippingFee
  const prepay = computePrepayAmount(totalAmount, input.paymentMethod, input.depositPercent)
  const leadDays = isTailored ? Math.max(...lines.filter((line) => line.isCustomFit).map((line) => line.leadTimeDays)) : null
  const shippingDetail: ShippingDetail = input.shipping
  const phone = normalizeVietnamPhone(input.customer.phone) ?? input.customer.phone

  for (let attempt = 0; attempt < 5; attempt++) {
    const orderCode = generateOrderCode()
    try {
      const token = await prisma.$transaction(async (tx) => {
        // Trừ tồn kho có điều kiện (stock >= qty) — hai người mua món cuối cùng thì chỉ một người thành công
        for (const line of lines) {
          if (line.isCustomFit || !line.variantId) continue
          const updated = await tx.productVariant.updateMany({
            where: { id: line.variantId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          })
          if (updated.count === 0) throw new AppError(409, 'ORDER_ITEM_OUT_OF_STOCK')
        }

        const order = await tx.order.create({
          data: {
            orderNumber: orderCode,
            userId: userId ?? null,
            customerName: input.customer.fullName,
            customerEmail: normalizeEmail(input.customer.email),
            customerPhone: phone,
            shippingAddress: formatAddress(input.shipping),
            shippingDetail: { ...shippingDetail },
            note: input.note || null,
            subTotal,
            shippingFee,
            totalAmount,
            depositAmount: prepay,
            isTailored,
            paymentMethod: input.paymentMethod,
            dueDate: leadDays ? new Date(Date.now() + leadDays * 24 * 60 * 60 * 1000) : null,
            items: {
              create: lines.map((line) => ({
                productId: line.productId,
                variantId: line.variantId,
                productName: line.productName,
                variantName: line.variantName,
                sku: line.sku,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                totalPrice: line.unitPrice * line.quantity,
                isCustomFit: line.isCustomFit,
                tailoringStatus: line.isCustomFit ? 'WAITING_FABRIC' : 'NOT_APPLICABLE',
                customNote: line.customNote,
                ...measurementColumns(line.measurements),
              })),
            },
          },
        })
        return createOrderAccessToken(order.id, tx)
      }, PLACE_ORDER_TX_OPTIONS)

      void notifyOrderPlaced({ orderCode, email: normalizeEmail(input.customer.email), phone, token, locale: input.locale })
      return { orderCode, accessToken: token }
    } catch (error) {
      // Trùng mã đơn (rất hiếm) → sinh mã khác
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue
      throw error
    }
  }
  throw new AppError(500, 'ORDER_CREATE_FAILED')
}

// ─── Đọc đơn ───────────────────────────────────────────────────────────────────

const timelineInclude = {
  items: { orderBy: { createdAt: 'asc' }, include: { product: { select: { images: true } } } },
  tailoringLogs: { orderBy: { createdAt: 'asc' }, include: { orderItem: { select: { productName: true } } } },
  appointments: { orderBy: { scheduledAt: 'asc' }, where: { status: { not: 'CANCELLED' } } },
} satisfies Prisma.OrderInclude

type TimelineOrder = Prisma.OrderGetPayload<{ include: typeof timelineInclude }>

async function loadTimelineOrder(where: Prisma.OrderWhereUniqueInput): Promise<TimelineOrder | null> {
  return prisma.order.findUnique({ where, include: timelineInclude })
}

function toTimeline(order: TimelineOrder): OrderTimelineDto {
  const tailoredItems = order.items.filter((item) => item.isCustomFit)
  const progress = resolveTrackingProgress(
    order.orderStatus,
    order.items.map((item) => item.tailoringStatus)
  )

  // Mốc của mỗi bước = lần đầu xưởng ghi nhận bước đó
  const stepDates: (string | null)[] = TRACKING_STEPS.map(() => null)
  stepDates[0] = order.createdAt.toISOString()
  for (const log of order.tailoringLogs) {
    const step = tailoringStepIndex(log.status)
    if (step > 0 && !stepDates[step]) stepDates[step] = log.createdAt.toISOString()
  }
  if (progress.currentStep >= 4 && !stepDates[4]) stepDates[4] = order.updatedAt.toISOString()

  const orderEditable = (ADDRESS_EDITABLE_STATUSES as readonly string[]).includes(order.orderStatus)
  const measurementsEditable = (MEASUREMENT_EDITABLE_ORDER_STATUSES as readonly string[]).includes(order.orderStatus)
  const prepayDue = outstandingPrepay(order)

  return {
    orderCode: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: asPaymentMethod(order.paymentMethod),
    isTailored: order.isTailored,
    dueDate: order.dueDate?.toISOString() ?? null,
    progress,
    stepDates,
    customerName: order.customerName,
    maskedPhone: maskPhone(order.customerPhone),
    shippingAddress: order.shippingAddress,
    shippingDetail: readShippingDetail(order.shippingDetail),
    canEditAddress: orderEditable,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantName: item.variantName,
      image: item.product.images[0] ?? null,
      quantity: item.quantity,
      unitPrice: toVnd(item.unitPrice),
      totalPrice: toVnd(item.totalPrice),
      isCustomFit: item.isCustomFit,
      tailoringStatus: item.tailoringStatus,
      measurements: pickMeasurements(item),
      customNote: item.customNote,
      canEditMeasurements:
        item.isCustomFit &&
        measurementsEditable &&
        (MEASUREMENT_EDITABLE_TAILORING as readonly string[]).includes(item.tailoringStatus),
    })),
    events: order.tailoringLogs.map((log) => ({
      id: log.id,
      step: TRACKING_STEPS[tailoringStepIndex(log.status)],
      status: log.status,
      note: log.note,
      images: log.images,
      createdAt: log.createdAt.toISOString(),
      itemName: tailoredItems.length > 1 ? (log.orderItem?.productName ?? null) : null,
    })),
    // Không trả ghi chú nội bộ của lịch hẹn
    appointments: order.appointments.map((appointment) => ({
      id: appointment.id,
      type: appointment.type,
      status: appointment.status,
      scheduledAt: appointment.scheduledAt.toISOString(),
    })),
    amounts: toAmounts(order),
    payment: prepayDue > 0 ? buildPaymentInstruction(order.orderNumber, prepayDue) : null,
    isGuestOrder: order.userId === null,
  }
}

/**
 * Cơ chế A — tra cứu bằng mã đơn + SĐT/email. Sai mã hay sai liên hệ đều trả CÙNG một lỗi để không dò được đơn tồn tại.
 */
export async function lookupOrder(input: LookupOrderInput): Promise<OrderLookupDto> {
  const order = await prisma.order.findUnique({
    where: { orderNumber: input.orderCode },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  })

  const contact = input.contact.trim()
  const matches =
    !!order &&
    (contact.includes('@')
      ? normalizeEmail(contact) === normalizeEmail(order.customerEmail)
      : (normalizeVietnamPhone(contact.replace(/\s+/g, '')) ?? '') === (normalizeVietnamPhone(order.customerPhone) ?? order.customerPhone))

  if (!order || !matches) throw new AppError(404, 'ORDER_LOOKUP_FAILED')

  return {
    orderCode: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    orderStatus: order.orderStatus,
    isTailored: order.isTailored,
    dueDate: order.dueDate?.toISOString() ?? null,
    progress: resolveTrackingProgress(order.orderStatus, order.items.map((item) => item.tailoringStatus)),
    items: order.items.map((item) => ({
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      isCustomFit: item.isCustomFit,
    })),
  }
}

/** Cơ chế B — timeline đầy đủ qua magic link */
export async function getTimelineByToken(token: string): Promise<OrderTimelineDto> {
  const orderId = await resolveOrderAccessToken(token)
  const order = await loadTimelineOrder({ id: orderId })
  if (!order) throw new AppError(404, 'ORDER_LINK_INVALID')
  return toTimeline(order)
}

// ─── OTP & sửa đơn ─────────────────────────────────────────────────────────────

function editGrantKey(grant: string) {
  return `order-edit:${hashToken(grant)}`
}

/**
 * Gửi OTP tới SĐT của đơn (sửa đơn hoặc tạo tài khoản từ đơn). Mã gắn với orderId.
 */
export async function sendOrderOtp(token: string, purpose: 'EDIT' | 'CLAIM'): Promise<SendOtpResult & { maskedPhone: string }> {
  const orderId = await resolveOrderAccessToken(token)
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, customerPhone: true, userId: true } })
  if (!order) throw new AppError(404, 'ORDER_LINK_INVALID')
  if (purpose === 'CLAIM' && order.userId) throw new AppError(409, 'ORDER_ALREADY_LINKED')

  const phone = normalizeVietnamPhone(order.customerPhone)
  if (!phone) throw new AppError(400, 'INVALID_PHONE_NUMBER')

  const result = await deliverOtp(phone, purpose === 'EDIT' ? 'ORDER_EDIT' : 'ORDER_CLAIM', order.id)
  return { ...result, maskedPhone: maskPhone(phone) }
}

/** Nhập đúng OTP → cấp phiên sửa đơn 15 phút (chuỗi ngẫu nhiên, Redis chỉ giữ hash) */
export async function verifyOrderEdit(token: string, code: string) {
  const orderId = await resolveOrderAccessToken(token)
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, customerPhone: true } })
  if (!order) throw new AppError(404, 'ORDER_LINK_INVALID')

  await verifyOtp(order.customerPhone, 'ORDER_EDIT', code, order.id)

  const editToken = randomBytes(24).toString('base64url')
  await redis.set(editGrantKey(editToken), order.id, 'EX', EDIT_GRANT_TTL_SECONDS)
  return { editToken, ttl: EDIT_GRANT_TTL_SECONDS }
}

async function assertEditGrant(token: string, editToken: string): Promise<string> {
  const orderId = await resolveOrderAccessToken(token)
  const grantedOrderId = await redis.get(editGrantKey(editToken))
  if (grantedOrderId !== orderId) throw new AppError(401, 'ORDER_EDIT_SESSION_EXPIRED')
  return orderId
}

export async function updateOrderAddress(input: UpdateOrderAddressInput): Promise<OrderTimelineDto> {
  const orderId = await assertEditGrant(input.token, input.editToken)
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { orderStatus: true } })
  if (!order) throw new AppError(404, 'ORDER_LINK_INVALID')
  if (!(ADDRESS_EDITABLE_STATUSES as readonly string[]).includes(order.orderStatus)) {
    throw new AppError(409, 'ORDER_ADDRESS_LOCKED')
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { shippingAddress: formatAddress(input.shipping), shippingDetail: { ...input.shipping } },
  })
  const updated = await loadTimelineOrder({ id: orderId })
  return toTimeline(updated!)
}

export async function updateOrderMeasurements(input: UpdateOrderMeasurementsInput): Promise<OrderTimelineDto> {
  const orderId = await assertEditGrant(input.token, input.editToken)
  const item = await prisma.orderItem.findFirst({
    where: { id: input.itemId, orderId },
    select: { id: true, isCustomFit: true, tailoringStatus: true, order: { select: { orderStatus: true } } },
  })
  if (!item || !item.isCustomFit) throw new AppError(404, 'ORDER_ITEM_NOT_FOUND')
  const editable =
    (MEASUREMENT_EDITABLE_ORDER_STATUSES as readonly string[]).includes(item.order.orderStatus) &&
    (MEASUREMENT_EDITABLE_TAILORING as readonly string[]).includes(item.tailoringStatus)
  if (!editable) throw new AppError(409, 'ORDER_MEASUREMENTS_LOCKED')

  await prisma.orderItem.update({
    where: { id: item.id },
    data: { ...measurementColumns(input.measurements), customNote: input.customNote ?? null },
  })
  const updated = await loadTimelineOrder({ id: orderId })
  return toTimeline(updated!)
}

// ─── Đơn của khách đã đăng nhập ────────────────────────────────────────────────

/** Danh sách đơn + số lượng theo từng nhóm (số đơn của một khách nhỏ → lọc & phân trang trong bộ nhớ) */
export async function listMyOrders(userId: string, query: ListMyOrdersQuery) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { items: { orderBy: { createdAt: 'asc' }, include: { product: { select: { images: true } } } } },
  })

  const summaries: CustomerOrderSummaryDto[] = orders.map((order) => {
    const paymentMethod = asPaymentMethod(order.paymentMethod)
    return {
      orderCode: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod,
      stage: resolveCustomerOrderStage({ ...order, paymentMethod }),
      isTailored: order.isTailored,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      previewImages: order.items.map((item) => item.product.images[0]).filter((src): src is string => Boolean(src)).slice(0, 3),
      firstItemName: order.items[0]?.productName ?? '',
      amounts: toAmounts(order),
    }
  })

  const counts: Record<string, number> = { ALL: summaries.length }
  for (const summary of summaries) counts[summary.stage] = (counts[summary.stage] ?? 0) + 1

  const filtered = query.status === 'ALL' ? summaries : summaries.filter((summary) => summary.stage === query.status)
  const totalItems = filtered.length
  const start = (query.page - 1) * query.limit

  return {
    data: filtered.slice(start, start + query.limit),
    meta: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)), counts },
  }
}

async function findOwnedOrder(userId: string, orderCode: string) {
  const order = await loadTimelineOrder({ orderNumber: orderCode })
  // Đơn của người khác trả cùng lỗi với đơn không tồn tại
  if (!order || order.userId !== userId) throw new AppError(404, 'ORDER_NOT_FOUND')
  return order
}

export async function getMyOrder(userId: string, orderCode: string): Promise<OrderTimelineDto> {
  return toTimeline(await findOwnedOrder(userId, orderCode))
}

/** Chủ đơn lấy link tra cứu mới (để sửa số đo / địa chỉ qua OTP, hoặc gửi cho người nhận) */
export async function createMyOrderLink(userId: string, orderCode: string) {
  const order = await findOwnedOrder(userId, orderCode)
  return { accessToken: await createOrderAccessToken(order.id) }
}
