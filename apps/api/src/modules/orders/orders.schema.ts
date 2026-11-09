import { z } from 'zod'
import { emailSchema, vietnamPhoneSchema, verificationCodeSchema } from '@repo/shared/validation'
import {
  CUSTOMER_ORDER_FILTERS,
  DEPOSIT_PERCENT_MAX,
  DEPOSIT_PERCENT_MIN,
  ORDER_CODE_REGEX,
  ORDER_MEASUREMENT_KEYS,
  PAYMENT_METHODS,
  normalizeOrderCode,
} from '@repo/shared/orders'
import {
  COLLARS,
  COLORS,
  DECORATIONS,
  FABRICS,
  LENGTHS,
  MEASURE_MODES,
  MOTIFS,
  OCCASIONS,
  PANTS,
  SLEEVES,
  STANDARD_SIZES,
  STYLES,
  TIMELINES,
} from '@repo/shared/bespoke'
import { LOCALES } from '@repo/shared'

const ids = <T extends readonly { id: string }[]>(list: T) => list.map((item) => item.id) as [T[number]['id'], ...T[number]['id'][]]

export const MAX_ORDER_LINES = 20
export const MAX_LINE_QUANTITY = 10

const orderCodeSchema = z
  .string()
  .transform(normalizeOrderCode)
  .pipe(z.string().regex(ORDER_CODE_REGEX, 'ORDER_CODE_INVALID'))

/** Token gốc của link tra cứu (base64url 43 ký tự) — đi trong body để không nằm trong log URL */
const accessTokenSchema = z.string().trim().min(20, 'ORDER_LINK_INVALID').max(200, 'ORDER_LINK_INVALID')

/** Số đo (cm / kg) — khoảng rộng để chặn gõ nhầm, thợ may kiểm tra lại khi nhận đơn */
const measurementsSchema = z
  .object(
    Object.fromEntries(
      ORDER_MEASUREMENT_KEYS.map((key) => [key, z.number('MEASUREMENT_OUT_OF_RANGE').min(1, 'MEASUREMENT_OUT_OF_RANGE').max(300, 'MEASUREMENT_OUT_OF_RANGE').optional()])
    ) as Record<(typeof ORDER_MEASUREMENT_KEYS)[number], z.ZodOptional<z.ZodNumber>>
  )
  .strict()

const shippingSchema = z.object({
  province: z.string().trim().min(1, 'PROVINCE_NAME_REQUIRED').max(100),
  district: z.string().trim().min(1, 'DISTRICT_NAME_REQUIRED').max(100),
  ward: z.string().trim().min(1, 'WARD_NAME_REQUIRED').max(100),
  addressLine: z.string().trim().min(1, 'ADDRESS_LINE_REQUIRED').max(255),
})

const bespokeSchema = z.object({
  occasion: z.enum(OCCASIONS),
  style: z.enum(ids(STYLES)),
  fabric: z.enum(ids(FABRICS)),
  color: z.enum(ids(COLORS)),
  collar: z.enum(COLLARS),
  sleeve: z.enum(SLEEVES),
  length: z.enum(LENGTHS),
  decoration: z.enum(ids(DECORATIONS)),
  motif: z.enum(MOTIFS),
  pants: z.enum(ids(PANTS)),
  measureMode: z.enum(MEASURE_MODES),
  size: z.enum(STANDARD_SIZES),
  timeline: z.enum(TIMELINES),
})

const orderLineSchema = z.object({
  productSlug: z.string().trim().min(1).max(200),
  size: z.string().trim().max(40).optional(),
  color: z.string().trim().max(60).optional(),
  quantity: z.number().int().min(1, 'ORDER_QUANTITY_INVALID').max(MAX_LINE_QUANTITY, 'ORDER_QUANTITY_INVALID'),
  measurements: measurementsSchema.optional(),
  customNote: z.string().trim().max(500).optional(),
  /** Có cấu hình thiết kế riêng → server gắn vào sản phẩm thiết kế riêng và tự báo giá */
  bespoke: bespokeSchema.optional(),
})

export const placeOrderSchema = z.object({
  body: z.object({
    customer: z.object({
      fullName: z.string().trim().min(1, 'RECEIVER_NAME_REQUIRED').max(100),
      phone: z.string().transform((value) => value.replace(/\s+/g, '')).pipe(vietnamPhoneSchema),
      email: emailSchema,
    }),
    shipping: shippingSchema,
    note: z.string().trim().max(500).optional(),
    items: z.array(orderLineSchema).min(1, 'ORDER_EMPTY').max(MAX_ORDER_LINES, 'ORDER_TOO_MANY_ITEMS'),
    paymentMethod: z.enum(PAYMENT_METHODS, 'ORDER_PAYMENT_METHOD_INVALID'),
    depositPercent: z.number().int().min(DEPOSIT_PERCENT_MIN, 'ORDER_DEPOSIT_PERCENT_INVALID').max(DEPOSIT_PERCENT_MAX, 'ORDER_DEPOSIT_PERCENT_INVALID').optional(),
    /** Ngôn ngữ của link tra cứu gửi qua email / SMS */
    locale: z.enum(LOCALES).default('vi'),
  }),
})

export const lookupOrderSchema = z.object({
  body: z.object({
    orderCode: orderCodeSchema,
    /** SĐT hoặc email đã dùng khi đặt */
    contact: z.string().trim().min(3, 'ORDER_CONTACT_REQUIRED').max(254),
  }),
})

export const trackOrderSchema = z.object({
  body: z.object({ token: accessTokenSchema }),
})

export const sendOrderOtpSchema = z.object({
  body: z.object({
    token: accessTokenSchema,
    /** EDIT: sửa số đo / địa chỉ · CLAIM: tạo tài khoản từ đơn */
    purpose: z.enum(['EDIT', 'CLAIM']),
  }),
})

export const verifyOrderEditSchema = z.object({
  body: z.object({ token: accessTokenSchema, code: verificationCodeSchema }),
})

const editGrantSchema = z.string().trim().min(20, 'ORDER_EDIT_SESSION_EXPIRED').max(200, 'ORDER_EDIT_SESSION_EXPIRED')

export const updateOrderAddressSchema = z.object({
  body: z.object({
    token: accessTokenSchema,
    editToken: editGrantSchema,
    shipping: shippingSchema,
  }),
})

export const updateOrderMeasurementsSchema = z.object({
  body: z.object({
    token: accessTokenSchema,
    editToken: editGrantSchema,
    itemId: z.string().uuid('ORDER_ITEM_NOT_FOUND'),
    measurements: measurementsSchema,
    customNote: z.string().trim().max(500).optional(),
  }),
})

export const listMyOrdersSchema = z.object({
  query: z.object({
    status: z.enum(CUSTOMER_ORDER_FILTERS).default('ALL'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
})

export const myOrderParamsSchema = z.object({
  params: z.object({ orderCode: orderCodeSchema }),
})

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>['body']
export type OrderLineInput = PlaceOrderInput['items'][number]
export type ShippingInput = z.infer<typeof shippingSchema>
export type OrderMeasurementsInput = z.infer<typeof measurementsSchema>
export type LookupOrderInput = z.infer<typeof lookupOrderSchema>['body']
export type UpdateOrderAddressInput = z.infer<typeof updateOrderAddressSchema>['body']
export type UpdateOrderMeasurementsInput = z.infer<typeof updateOrderMeasurementsSchema>['body']
export type ListMyOrdersQuery = z.infer<typeof listMyOrdersSchema>['query']
