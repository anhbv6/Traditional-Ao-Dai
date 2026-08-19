import { Router } from 'express'
import * as otpController from './otp.controller'
import { validate } from '../../shared/middlewares/validate'
import { sendOtpSchema, verifyOtpSchema } from './otp.schema'

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
 *         description: Validation error
 *       429:
 *         description: Cooldown active
 */
router.post('/send', validate(sendOtpSchema), otpController.sendOtp)

/**
 * @openapi
 * /api/auth/otp/verify:
 *   post:
 *     summary: Verify OTP
 *     description: Verifies the 6-digit OTP code against the one stored in Redis.
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
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               purpose:
 *                 type: string
 *                 enum: [REGISTER, LOGIN, RESET_PASSWORD]
 *                 example: REGISTER
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                   example: OTP_VERIFIED_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid OTP or expired
 */
router.post('/verify', validate(verifyOtpSchema), otpController.verifyOtp)

export default router
