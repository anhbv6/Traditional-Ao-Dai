import { Router } from 'express'
import * as controller from './orders.controller'
import { validate } from '../../core/middlewares/validate'
import { rateLimit } from '../../core/middlewares/rateLimit'
import { optionalAuth, requireAuth } from '../../core/middlewares/authGuard'
import {
  listMyOrdersSchema,
  lookupOrderSchema,
  myOrderParamsSchema,
  placeOrderSchema,
  sendOrderOtpSchema,
  trackOrderSchema,
  updateOrderAddressSchema,
  updateOrderMeasurementsSchema,
  verifyOrderEditSchema,
} from './orders.schema'

const router = Router()

const MINUTE = 60
const byIp = (name: string, max: number, windowSec: number) => rateLimit({ name, max, windowSec })
const byBody = (name: string, field: string, max: number, windowSec: number) =>
  rateLimit({
    name,
    max,
    windowSec,
    key: (req) => {
      const value = req.body?.[field]
      return typeof value === 'string' ? value : undefined
    },
  })

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Đặt hàng (khách vãng lai hoặc đã đăng nhập)
 *     description: |
 *       Server tính lại toàn bộ tiền từ DB (giá, phí ship 30.000đ); mã giảm giá demo phía client không được áp.
 *       Đơn có món may đo (saleMode CUSTOM / có số đo / thiết kế riêng) KHÔNG được COD 100% — chọn DEPOSIT (cọc 30–50%, còn lại COD)
 *       hoặc BANK_TRANSFER (100%). Trả mã đơn TC-YYMM-XXXX và token gốc của link tra cứu (chỉ trả một lần, gửi kèm email/SMS).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer, shipping, items, paymentMethod]
 *             properties:
 *               customer: { type: object, example: { fullName: 'Nguyễn Mai', phone: '0912345678', email: 'mai@example.com' } }
 *               shipping: { type: object, example: { province: 'Hà Nội', district: 'Ba Đình', ward: 'Kim Mã', addressLine: '12 Kim Mã' } }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   example: { productSlug: 'ao-dai-gam-hoa-sen-co-dien', size: 'M', quantity: 1 }
 *               paymentMethod: { type: string, enum: [COD, BANK_TRANSFER, DEPOSIT] }
 *               depositPercent: { type: integer, minimum: 30, maximum: 50 }
 *               locale: { type: string, enum: [vi, en] }
 *     responses:
 *       201:
 *         description: ORDER_PLACED — data { orderCode, accessToken }
 *       400:
 *         description: VALIDATION_ERROR, ORDER_ITEM_UNAVAILABLE, ORDER_ITEM_NOT_CUSTOMIZABLE, MEASUREMENT_REQUIRED, ORDER_TAILORED_REQUIRES_DEPOSIT, ORDER_PAYMENT_METHOD_INVALID
 *       409:
 *         description: ORDER_ITEM_OUT_OF_STOCK
 *       429:
 *         description: TOO_MANY_REQUESTS
 *       500:
 *         description: ORDER_CREATE_FAILED
 */
router.post('/', validate(placeOrderSchema), byIp('order-place-ip', 15, 60 * MINUTE), optionalAuth, controller.placeOrder)

/**
 * @openapi
 * /api/orders/lookup:
 *   post:
 *     summary: Tra cứu đơn bằng mã đơn + SĐT/email (cơ chế A)
 *     description: Chỉ trả dữ liệu khi cả mã đơn và liên hệ đều khớp. Sai mã hay sai liên hệ đều trả cùng ORDER_LOOKUP_FAILED (chống dò đơn). Trả tối giản — không có địa chỉ, số đo.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderCode, contact]
 *             properties:
 *               orderCode: { type: string, example: TC-2611-AB7K }
 *               contact: { type: string, example: '0912345678' }
 *     responses:
 *       200:
 *         description: ORDER_FOUND — stepper 5 bước
 *       400:
 *         description: VALIDATION_ERROR, ORDER_CODE_INVALID, ORDER_CONTACT_REQUIRED
 *       404:
 *         description: ORDER_LOOKUP_FAILED
 *       429:
 *         description: TOO_MANY_REQUESTS
 */
router.post(
  '/lookup',
  validate(lookupOrderSchema),
  byIp('order-lookup-ip', 10, 15 * MINUTE),
  byBody('order-lookup-code', 'orderCode', 5, 15 * MINUTE),
  controller.lookupOrder
)

/**
 * @openapi
 * /api/orders/track:
 *   post:
 *     summary: Xem timeline đơn qua magic link (cơ chế B)
 *     description: Token READ (gửi trong body để không nằm trong log URL). Trả tiến độ, ảnh xưởng, lịch thử áo, số đo, tiền, hướng dẫn VietQR nếu còn phải chuyển khoản.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [token], properties: { token: { type: string } } }
 *     responses:
 *       200:
 *         description: ORDER_FOUND
 *       400:
 *         description: VALIDATION_ERROR
 *       404:
 *         description: ORDER_LINK_INVALID (sai / hết hạn / bị thu hồi)
 *       429:
 *         description: TOO_MANY_REQUESTS
 */
router.post('/track', validate(trackOrderSchema), byIp('order-track-ip', 60, 15 * MINUTE), controller.trackOrder)

/**
 * @openapi
 * /api/orders/track/otp:
 *   post:
 *     summary: Gửi OTP tới SĐT của đơn
 *     description: EDIT để sửa số đo / địa chỉ, CLAIM để tạo tài khoản từ đơn. Chờ 60 giây giữa 2 lần, tối đa 10 SMS/ngày/SĐT. Ngoài production trả `devCode`.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, purpose]
 *             properties:
 *               token: { type: string }
 *               purpose: { type: string, enum: [EDIT, CLAIM] }
 *     responses:
 *       200:
 *         description: OTP_SENT_SUCCESS — data { ttl, maskedPhone }
 *       400:
 *         description: VALIDATION_ERROR, INVALID_PHONE_NUMBER
 *       404:
 *         description: ORDER_LINK_INVALID
 *       409:
 *         description: ORDER_ALREADY_LINKED (CLAIM với đơn đã gắn tài khoản)
 *       429:
 *         description: OTP_COOLDOWN_ACTIVE, OTP_DAILY_LIMIT_REACHED, TOO_MANY_REQUESTS
 */
router.post('/track/otp', validate(sendOrderOtpSchema), byIp('order-otp-ip', 10, 15 * MINUTE), controller.sendOrderOtp)

/**
 * @openapi
 * /api/orders/track/verify:
 *   post:
 *     summary: Xác minh OTP để mở phiên sửa đơn (15 phút)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, code]
 *             properties:
 *               token: { type: string }
 *               code: { type: string, example: '123456' }
 *     responses:
 *       200:
 *         description: ORDER_EDIT_VERIFIED — data { editToken, ttl }
 *       400:
 *         description: VALIDATION_ERROR, VERIFICATION_CODE_INVALID, OTP_EXPIRED_OR_NOT_FOUND, OTP_INCORRECT
 *       404:
 *         description: ORDER_LINK_INVALID
 *       429:
 *         description: OTP_TOO_MANY_ATTEMPTS, TOO_MANY_REQUESTS
 */
router.post('/track/verify', validate(verifyOrderEditSchema), byIp('order-verify-ip', 20, 15 * MINUTE), controller.verifyOrderEdit)

/**
 * @openapi
 * /api/orders/track/address:
 *   patch:
 *     summary: Sửa địa chỉ giao hàng (cần phiên sửa đơn từ OTP)
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: ORDER_ADDRESS_UPDATED — data là timeline mới
 *       400:
 *         description: VALIDATION_ERROR, PROVINCE_NAME_REQUIRED, DISTRICT_NAME_REQUIRED, WARD_NAME_REQUIRED, ADDRESS_LINE_REQUIRED
 *       401:
 *         description: ORDER_EDIT_SESSION_EXPIRED
 *       404:
 *         description: ORDER_LINK_INVALID
 *       409:
 *         description: ORDER_ADDRESS_LOCKED (đơn đã giao cho vận chuyển / đã hủy)
 */
router.patch('/track/address', validate(updateOrderAddressSchema), byIp('order-edit-ip', 30, 15 * MINUTE), controller.updateOrderAddress)

/**
 * @openapi
 * /api/orders/track/measurements:
 *   patch:
 *     summary: Sửa số đo một món may đo (cần phiên sửa đơn từ OTP; chỉ khi xưởng chưa cắt vải)
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: ORDER_MEASUREMENTS_UPDATED — data là timeline mới
 *       400:
 *         description: VALIDATION_ERROR, MEASUREMENT_OUT_OF_RANGE
 *       401:
 *         description: ORDER_EDIT_SESSION_EXPIRED
 *       404:
 *         description: ORDER_LINK_INVALID, ORDER_ITEM_NOT_FOUND
 *       409:
 *         description: ORDER_MEASUREMENTS_LOCKED
 */
router.patch(
  '/track/measurements',
  validate(updateOrderMeasurementsSchema),
  byIp('order-edit-ip', 30, 15 * MINUTE),
  controller.updateOrderMeasurements
)

/**
 * @openapi
 * /api/orders/me:
 *   get:
 *     summary: Đơn hàng của tôi (lọc theo nhóm trạng thái)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ALL, AWAITING_PAYMENT, PROCESSING, TAILORING, SHIPPING, COMPLETED, CANCELLED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Danh sách đơn; meta { page, limit, totalItems, totalPages, counts }
 *       400:
 *         description: VALIDATION_ERROR
 *       401:
 *         description: AUTHENTICATION_REQUIRED, TOKEN_EXPIRED, INVALID_TOKEN
 */
router.get('/me', validate(listMyOrdersSchema), requireAuth, controller.listMyOrders)

/**
 * @openapi
 * /api/orders/me/{orderCode}:
 *   get:
 *     summary: Chi tiết + timeline một đơn của tôi
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Timeline đơn
 *       400:
 *         description: VALIDATION_ERROR, ORDER_CODE_INVALID
 *       401:
 *         description: AUTHENTICATION_REQUIRED
 *       404:
 *         description: ORDER_NOT_FOUND (không tồn tại hoặc không thuộc tài khoản)
 */
router.get('/me/:orderCode', validate(myOrderParamsSchema), requireAuth, controller.getMyOrder)

/**
 * @openapi
 * /api/orders/me/{orderCode}/link:
 *   post:
 *     summary: Tạo link tra cứu (READ) cho đơn của tôi — dùng để sửa số đo / địa chỉ qua OTP
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: data { accessToken }
 *       401:
 *         description: AUTHENTICATION_REQUIRED
 *       404:
 *         description: ORDER_NOT_FOUND
 *       429:
 *         description: TOO_MANY_REQUESTS
 */
router.post(
  '/me/:orderCode/link',
  validate(myOrderParamsSchema),
  byIp('order-link-ip', 20, 15 * MINUTE),
  requireAuth,
  controller.createMyOrderLink
)

export default router
