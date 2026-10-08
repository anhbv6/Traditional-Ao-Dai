import { Router } from 'express'
import * as otpController from './otp.controller'
import { validate } from '../../shared/middlewares/validate'
import { sendOtpSchema } from './otp.schema'
import { rateLimit } from '../../shared/utils/rateLimit'

const router = Router()

/**
 * @openapi
 * /api/auth/otp/send:
 *   post:
 *     summary: Send OTP
 *     description: Generates a 6-digit OTP code, stores it in Redis and sends it via SMS.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - purpose
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               purpose:
 *                 type: string
 *                 enum: [REGISTER, LOGIN, RESET_PASSWORD]
 *                 example: REGISTER
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: OTP_SENT_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     ttl:
 *                       type: integer
 *                       example: 300
 *       400:
 *         description: VALIDATION_ERROR, INVALID_PHONE_NUMBER, PHONE_ALREADY_EXISTS (purpose REGISTER)
 *       404:
 *         description: USER_NOT_FOUND (purpose LOGIN). Với RESET_PASSWORD luôn trả về thành công để không lộ SĐT tồn tại hay không.
 *       429:
 *         description: OTP_COOLDOWN_ACTIVE (60s), OTP_DAILY_LIMIT_REACHED (10 SMS/SĐT/ngày) hoặc TOO_MANY_REQUESTS (giới hạn theo IP)
 */
router.post(
  '/send',
  validate(sendOtpSchema),
  rateLimit({ name: 'otp-send-ip-hour', max: 10, windowSec: 60 * 60 }),
  rateLimit({ name: 'otp-send-ip-day', max: 30, windowSec: 24 * 60 * 60 }),
  otpController.sendOtp
)

export default router
