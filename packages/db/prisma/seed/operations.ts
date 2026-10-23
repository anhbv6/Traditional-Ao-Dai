import { prisma, type AppointmentType, type OrderStatus, type PaymentStatus, type TailoringStatus } from '../../src'
import { DEMO_PRODUCT_SLUGS } from './catalog'
import { type SeededAccounts, type SeededCatalog } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const VN_OFFSET_MS = 7 * 60 * 60 * 1000

/** Mốc thời gian tính theo lúc chạy seed để dashboard luôn có dữ liệu "hôm nay" */
function clock(now = Date.now()) {
  return {
    inDays: (days: number) => new Date(now + days * DAY_MS),
    /** Giờ hôm nay theo giờ Việt Nam (UTC+7), vd. todayAt(9, 30) = 09:30 hôm nay */
    todayAt: (hour: number, minute = 0) => {
      const vn = new Date(now + VN_OFFSET_MS)
      return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate(), hour, minute) - VN_OFFSET_MS)
    },
  }
}

const MEASUREMENTS = { height: 160, weight: 48, bust: 82, waist: 64, hips: 88, shoulder: 36, shirtLength: 128, pantsLength: 102 }

interface DemoOrder {
  orderNumber: string
  customerName: string
  customerPhone: string
  productSlug: string
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  /** Tỷ lệ đã thu (cọc) trên tổng tiền */
  paidRatio: number
  tailoring: TailoringStatus
  dueInDays: number
  /** Gắn với tài khoản khách hàng demo (để thử "Đơn hàng của tôi") */
  ownedByDemoCustomer?: boolean
}

// Mỗi đơn ở một công đoạn may khác nhau để dashboard / Kanban xưởng may có đủ cột
const ORDERS: DemoOrder[] = [
  { orderNumber: 'AD-SEED-0001', customerName: 'Khách hàng Demo', customerPhone: '0900000002', productSlug: DEMO_PRODUCT_SLUGS.wedding, orderStatus: 'PENDING', paymentStatus: 'UNPAID', paidRatio: 0, tailoring: 'NOT_APPLICABLE', dueInDays: 12, ownedByDemoCustomer: true },
  { orderNumber: 'AD-SEED-0002', customerName: 'Trần Thu Hà', customerPhone: '0901000002', productSlug: DEMO_PRODUCT_SLUGS.lotus, orderStatus: 'CONFIRMED', paymentStatus: 'PARTIALLY_PAID', paidRatio: 0.5, tailoring: 'WAITING_FABRIC', dueInDays: 6 },
  { orderNumber: 'AD-SEED-0003', customerName: 'Lê Minh Châu', customerPhone: '0901000003', productSlug: DEMO_PRODUCT_SLUGS.linen, orderStatus: 'IN_PRODUCTION', paymentStatus: 'PARTIALLY_PAID', paidRatio: 0.5, tailoring: 'SEWING', dueInDays: 2 },
  { orderNumber: 'AD-SEED-0004', customerName: 'Phạm Ngọc Mai', customerPhone: '0901000004', productSlug: DEMO_PRODUCT_SLUGS.wedding, orderStatus: 'IN_PRODUCTION', paymentStatus: 'PARTIALLY_PAID', paidRatio: 0.5, tailoring: 'EMBROIDERY_BEADING', dueInDays: 3 },
  { orderNumber: 'AD-SEED-0005', customerName: 'Võ Thanh Tâm', customerPhone: '0901000005', productSlug: DEMO_PRODUCT_SLUGS.lotus, orderStatus: 'IN_PRODUCTION', paymentStatus: 'PARTIALLY_PAID', paidRatio: 0.5, tailoring: 'FITTING_IRONING', dueInDays: 1 },
  { orderNumber: 'AD-SEED-0006', customerName: 'Đặng Bảo Ngọc', customerPhone: '0901000006', productSlug: DEMO_PRODUCT_SLUGS.linen, orderStatus: 'READY_TO_SHIP', paymentStatus: 'PARTIALLY_PAID', paidRatio: 0.5, tailoring: 'COMPLETED', dueInDays: 2 },
]

interface DemoAppointment {
  /** Id cố định để upsert idempotent (lịch hẹn không có khóa tự nhiên) */
  id: string
  /** Lịch hẹn của đơn demo — lấy tên/SĐT/tài khoản từ đơn */
  orderNumber: string | null
  type: AppointmentType
  hour: number
  minute: number
  note: string
  /** Khách vãng lai chưa có đơn */
  walkIn?: { customerName: string; customerPhone: string }
}

const APPOINTMENTS: DemoAppointment[] = [
  { id: '7f1c2a10-0000-4000-8000-000000000001', orderNumber: 'AD-SEED-0001', type: 'MEASUREMENT', hour: 9, minute: 30, note: 'Đo áo dài cưới' },
  { id: '7f1c2a10-0000-4000-8000-000000000002', orderNumber: 'AD-SEED-0004', type: 'FITTING', hour: 14, minute: 0, note: 'Thử áo, sửa lại eo' },
  { id: '7f1c2a10-0000-4000-8000-000000000003', orderNumber: 'AD-SEED-0005', type: 'FITTING', hour: 16, minute: 30, note: 'Thử form lần cuối' },
  { id: '7f1c2a10-0000-4000-8000-000000000004', orderNumber: null, type: 'MEASUREMENT', hour: 18, minute: 0, note: 'Khách mới, may áo dài đi lễ', walkIn: { customerName: 'Hoàng Kim Oanh', customerPhone: '0901000007' } },
]

/** Cây vải dưới ngưỡng 3 m sẽ hiện cảnh báo sắp hết trên dashboard */
const FABRICS = [
  { code: 'LUA-HONG-01', name: 'Lụa tơ tằm hồng phấn', color: 'Hồng phấn', remainingMeters: 2.4, productSlug: DEMO_PRODUCT_SLUGS.lotus },
  { code: 'GAM-DO-01', name: 'Gấm ruby đỏ nhung', color: 'Đỏ nhung', remainingMeters: 1.6, productSlug: DEMO_PRODUCT_SLUGS.wedding },
  { code: 'LINEN-VANG-01', name: 'Linen vàng cúc', color: 'Vàng cúc', remainingMeters: 14, productSlug: DEMO_PRODUCT_SLUGS.linen },
  { code: 'VOAN-TRANG-01', name: 'Voan lụa trắng', color: 'Trắng', remainingMeters: 2.9, productSlug: null },
]

/**
 * Dữ liệu vận hành demo cho dashboard admin: đơn may đo (có cọc + ngày hẹn trả), lịch hẹn hôm nay, kho vải
 */
export async function seedOperations({ catalog, accounts }: { catalog: SeededCatalog; accounts: SeededAccounts }) {
  const { inDays, todayAt } = clock()

  const orders: Record<string, { id: string; customerName: string; customerPhone: string; userId: string | null }> = {}
  for (const o of ORDERS) {
    const product = catalog[o.productSlug]
    const price = Number(product.basePrice)
    const paidAmount = Math.round(price * o.paidRatio)
    const userId = o.ownedByDemoCustomer ? (accounts.customer?.id ?? null) : null
    const status = { orderStatus: o.orderStatus, paymentStatus: o.paymentStatus, paidAmount, dueDate: inDays(o.dueInDays) }

    const order = await prisma.order.upsert({
      where: { orderNumber: o.orderNumber },
      update: status,
      create: {
        ...status,
        orderNumber: o.orderNumber,
        userId,
        createdById: accounts.staff?.id,
        customerName: o.customerName,
        customerEmail: `${o.orderNumber.toLowerCase()}@example.com`,
        customerPhone: o.customerPhone,
        shippingAddress: 'Nhận tại tiệm',
        subTotal: price,
        totalAmount: price,
        paymentMethod: 'BANK_TRANSFER',
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: price,
            totalPrice: price,
            isCustomFit: true,
            tailoringStatus: o.tailoring,
            ...MEASUREMENTS,
          },
        },
      },
    })
    orders[o.orderNumber] = { id: order.id, customerName: o.customerName, customerPhone: o.customerPhone, userId }
  }
  console.log(`   🧾 ${ORDERS.length} đơn may đo demo`)

  for (const a of APPOINTMENTS) {
    const order = a.orderNumber ? orders[a.orderNumber] : null
    const data = {
      customerName: order?.customerName ?? a.walkIn?.customerName ?? '',
      customerPhone: order?.customerPhone ?? a.walkIn?.customerPhone ?? null,
      userId: order?.userId ?? null,
      orderId: order?.id ?? null,
      type: a.type,
      status: 'SCHEDULED' as const,
      scheduledAt: todayAt(a.hour, a.minute),
      note: a.note,
    }
    await prisma.appointment.upsert({ where: { id: a.id }, update: data, create: { id: a.id, ...data } })
  }
  console.log(`   📅 ${APPOINTMENTS.length} lịch hẹn hôm nay`)

  for (const { productSlug, ...fabric } of FABRICS) {
    const data = { ...fabric, productId: productSlug ? catalog[productSlug].id : null }
    await prisma.fabric.upsert({ where: { code: fabric.code }, update: data, create: data })
  }
  console.log(`   🧶 ${FABRICS.length} cây vải`)
}
