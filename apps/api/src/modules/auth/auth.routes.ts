import { Router } from 'express'
import * as adminAuthController from './admin/auth.controller'
import * as clientAuthController from './client/auth.controller'
import { validate } from '../../shared/middlewares/validate'
import {
  loginSchema,
  registerSchema,
  checkAccountSchema,
  otpLoginSchema,
  googleLoginSchema,
  forgotPasswordEmailSchema,
  resetPasswordEmailSchema,
  resetPasswordPhoneSchema,
  verifyResetPasswordEmailSchema,
  verifyResetPasswordPhoneSchema,
} from './auth.schema'
import { requireAuth } from '../../shared/middlewares/authGuard'
import { rateLimit } from '../../shared/utils/rateLimit'

const router = Router()

// ─── Rate limits (chống brute-force mật khẩu/OTP, spam email, dò tài khoản) ─────
const MINUTE = 60
const byIp = (name: string, max: number, windowSec: number) => rateLimit({ name, max, windowSec })
const byBody = (name: string, field: string, max: number, windowSec: number) =>
  rateLimit({
    name,
    max,
    windowSec,
    key: (req) => {
      const value = req.body?.[field]
      return typeof value === 'string' ? value.trim() : undefined
    },
  })

const loginLimits = [byIp('login-ip', 20, 15 * MINUTE), byBody('login-account', 'email', 10, 15 * MINUTE)]
const otpLoginLimits = [byIp('login-otp-ip', 20, 15 * MINUTE), byBody('login-otp-phone', 'phone', 10, 15 * MINUTE)]
const adminLoginLimits = [byIp('admin-login-ip', 10, 15 * MINUTE), byBody('admin-login-account', 'email', 5, 15 * MINUTE)]
const verifyCodeLimits = [byIp('verify-code-ip', 20, 15 * MINUTE)]

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Client Register
 *     description: Register a new customer account. Supports registration by email (requires registerType='email', email, password) or by phone (requires registerType='phone', phone, code, password).
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registerType
 *               - password
 *             properties:
 *               registerType:
 *                 type: string
 *                 enum: [email, phone]
 *                 example: email
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *               rememberMe:
 *                 type: boolean
 *                 description: If true, refresh token cookie persists for 7 days and rotates on refresh. If false, cookie is session-only and JWT expires after 24 hours.
 *                 example: true
 *               name:
 *                 type: string
 *                 example: "Nguyen Van A"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@aodai.vn
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               code:
 *                 type: string
 *                 description: Required if registerType is phone
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Registration successful
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
 *                   example: REGISTER_SUCCESS
 *       400:
 *         description: VALIDATION_ERROR, EMAIL_ALREADY_EXISTS, PHONE_ALREADY_EXISTS, OTP_EXPIRED_OR_NOT_FOUND, OTP_INCORRECT
 *       429:
 *         description: OTP_TOO_MANY_ATTEMPTS, TOO_MANY_REQUESTS
 */
router.post('/register', validate(registerSchema), byIp('register-ip', 10, 60 * MINUTE), clientAuthController.register)

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Client Login
 *     description: Authenticate customers using email or phone and password. Returns an access token and sets a refresh token in an HTTP-only cookie.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@aodai.vn
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful. Sets an HTTP-only cookie named `refreshToken`.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=abcde...; Path=/; HttpOnly; SameSite=Lax
 *             description: Contains the refresh token for token rotation.
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
 *                   example: LOGIN_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error
 *       401:
 *         description: INVALID_CREDENTIALS (không phân biệt sai tài khoản hay sai mật khẩu)
 *       403:
 *         description: ACCOUNT_DEACTIVATED
 *       429:
 *         description: TOO_MANY_REQUESTS (20 lần/15 phút/IP, 10 lần/15 phút/tài khoản)
 */
router.post('/login', validate(loginSchema), ...loginLimits, clientAuthController.login)

/**
 * @openapi
 * /api/auth/login/otp:
 *   post:
 *     summary: Client Login with OTP
 *     description: Authenticate customers using phone number and OTP code. Returns an access token, refresh token, and creates a user session.
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
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: LOGIN_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: VALIDATION_ERROR, ACCOUNT_NOT_REGISTERED, PHONE_NOT_VERIFIED (chỉ SĐT đã xác minh mới đăng nhập OTP được), OTP_EXPIRED_OR_NOT_FOUND, OTP_INCORRECT
 *       429:
 *         description: OTP_TOO_MANY_ATTEMPTS (sai 5 lần mã bị hủy), TOO_MANY_REQUESTS
 */
router.post('/login/otp', validate(otpLoginSchema), ...otpLoginLimits, clientAuthController.loginWithOtp)

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     summary: Client Login/Registration with Google
 *     description: Authenticate customers using Google OAuth credential (ID Token). Returns an access token, refresh token, and creates a user session.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google OAuth ID Token
 *                 example: "eyJhbGciOiJSUzI1NiIs..."
 *     responses:
 *       200:
 *         description: Authentication successful
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
 *                   example: LOGIN_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: GOOGLE_AUTH_FAILED, GOOGLE_TOKEN_INVALID, GOOGLE_EMAIL_NOT_VERIFIED
 *       403:
 *         description: ACCOUNT_DEACTIVATED, INSUFFICIENT_PERMISSIONS
 *       409:
 *         description: GOOGLE_EMAIL_ACCOUNT_UNVERIFIED (email đã có tài khoản chưa xác minh — đăng nhập bằng mật khẩu rồi liên kết Google trong hồ sơ), GOOGLE_ACCOUNT_MISMATCH (tài khoản đã liên kết một Google khác)
 */
router.post('/google', validate(googleLoginSchema), byIp('google-ip', 30, 15 * MINUTE), clientAuthController.loginWithGoogle)

/**
 * @openapi
 * /api/auth/forgot-password/email:
 *   post:
 *     summary: Request verification code to email
 *     description: Send a 6-digit password reset verification code to client's email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@aodai.vn
 *     responses:
 *       200:
 *         description: Verification code sent successfully
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
 *                   example: VERIFICATION_CODE_SENT
 *       429:
 *         description: COOLDOWN_ACTIVE (60s), EMAIL_DAILY_LIMIT_REACHED, TOO_MANY_REQUESTS. Luôn trả VERIFICATION_CODE_SENT dù email có tồn tại hay không (chống dò tài khoản).
 */
router.post('/forgot-password/email', validate(forgotPasswordEmailSchema), byIp('forgot-email-ip', 10, 60 * MINUTE), clientAuthController.forgotPasswordEmail)

/**
 * @openapi
 * /api/auth/forgot-password/email/verify:
 *   post:
 *     summary: Verify Email Reset Code
 *     description: Verify the 6-digit verification code sent to the client's email address. Returns a temporary reset token valid for resetting the password.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@aodai.vn
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Verification successful
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
 *                   example: RESET_CODE_VERIFIED
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       example: "abc123xyz456..."
 *                     expiresIn:
 *                       type: integer
 *                       example: 3600
 *       400:
 *         description: VERIFICATION_CODE_EXPIRED_OR_INVALID, INCORRECT_VERIFICATION_CODE
 *       429:
 *         description: VERIFICATION_TOO_MANY_ATTEMPTS (sai 5 lần mã bị hủy), TOO_MANY_REQUESTS
 */
router.post('/forgot-password/email/verify', validate(verifyResetPasswordEmailSchema), ...verifyCodeLimits, clientAuthController.verifyResetPasswordEmail)

/**
 * @openapi
 * /api/auth/forgot-password/phone/verify:
 *   post:
 *     summary: Verify Phone Reset Code
 *     description: Verify the 6-digit OTP code sent to the client's phone number. Returns a temporary reset token valid for resetting the password.
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
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Verification successful
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
 *                   example: RESET_CODE_VERIFIED
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       example: "abc123xyz456..."
 *                     expiresIn:
 *                       type: integer
 *                       example: 3600
 *       400:
 *         description: OTP_EXPIRED_OR_NOT_FOUND, OTP_INCORRECT, PHONE_NOT_VERIFIED
 *       429:
 *         description: OTP_TOO_MANY_ATTEMPTS, TOO_MANY_REQUESTS
 */
router.post('/forgot-password/phone/verify', validate(verifyResetPasswordPhoneSchema), ...verifyCodeLimits, clientAuthController.verifyResetPasswordPhone)

/**
 * @openapi
 * /api/auth/reset-password/email:
 *   post:
 *     summary: Reset password with email code
 *     description: Verify email code and set a new password. Invalidate all existing sessions.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@aodai.vn
 *               code:
 *                 type: string
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *                   example: PASSWORD_RESET_SUCCESS
 *       400:
 *         description: Incorrect or expired verification code
 *       404:
 *         description: User not found
 */
router.post('/reset-password/email', validate(resetPasswordEmailSchema), ...verifyCodeLimits, clientAuthController.resetPasswordEmail)

/**
 * @openapi
 * /api/auth/reset-password/phone:
 *   post:
 *     summary: Reset password with SMS OTP
 *     description: Verify SMS OTP code and set a new password. Invalidate all existing sessions.
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
 *               - code
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *               code:
 *                 type: string
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *                   example: PASSWORD_RESET_SUCCESS
 *       400:
 *         description: Incorrect or expired OTP code
 *       404:
 *         description: User not found
 */
router.post('/reset-password/phone', validate(resetPasswordPhoneSchema), ...verifyCodeLimits, clientAuthController.resetPasswordPhone)

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh Client Token
 *     description: Returns a new access token from the refresh token cookie. Remember-me sessions rotate the refresh token and reset the 7-day cookie maxAge; session-only logins keep the same browser session cookie until the 24-hour JWT expires or the browser session ends.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         schema:
 *           type: string
 *         required: true
 *         description: The client refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully. Sets a new HTTP-only cookie named `refreshToken`.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=abcde...; Path=/; HttpOnly; SameSite=Lax
 *             description: Contains the updated refresh token.
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
 *                   example: REFRESH_TOKEN_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Refresh token is missing, expired, or invalid
 */
router.post('/refresh-token', byIp('refresh-ip', 120, MINUTE), clientAuthController.refreshToken)

/**
 * @openapi
 * /api/auth/check-account:
 *   get:
 *     summary: Check Account Availability
 *     description: Verify if an email or phone number is already registered in the system.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: The email address to check
 *         example: admin@gmail.com
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: The phone number to check
 *         example: "0987654321"
 *     responses:
 *       200:
 *         description: Check completed successfully
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
 *                   example: CHECK_ACCOUNT_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       example: true
 *                     reason:
 *                       type: string
 *                       example: AVAILABLE
 *       400:
 *         description: Validation error or missing parameters
 */
router.get('/check-account', validate(checkAccountSchema), byIp('check-account-ip', 30, 5 * MINUTE), clientAuthController.checkAccount)

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get Logged In User Profile
 *     description: Returns the profile data of the currently authenticated user using their JWT token.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clm1234567890
 *                     email:
 *                       type: string
 *                       example: user@aodai.vn
 *                     role:
 *                       type: string
 *                       example: CUSTOMER
 *       401:
 *         description: Unauthorized - JWT token missing, invalid or expired
 */
router.get('/me', requireAuth, clientAuthController.getMe)

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Client Logout
 *     description: Revoke the current customer session by clearing the refresh token cookie.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         schema:
 *           type: string
 *         required: false
 *         description: The client refresh token cookie to revoke
 *     responses:
 *       200:
 *         description: Logout successful. Clears the HTTP-only cookie named `refreshToken`.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax
 *             description: Clears the refresh token cookie.
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
 *                   example: LOGOUT_SUCCESS
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 */
router.post('/logout', clientAuthController.logout)

/**
 * @openapi
 * /api/auth/admin/login:
 *   post:
 *     summary: Admin Login
 *     description: Authenticate administrative users using email and password. Returns a JWT access token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@aodai.vn
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: ADMIN_LOGIN_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [ADMIN, STAFF]
 *                         staffPermission:
 *                           type: object
 *                           nullable: true
 *       400:
 *         description: Validation error
 *       401:
 *         description: INVALID_CREDENTIALS
 *       429:
 *         description: TOO_MANY_REQUESTS (10 lần/15 phút/IP, 5 lần/15 phút/tài khoản)
 *     x-notes: Thành công thì token được đặt vào cookie httpOnly `admin_token` (SameSite=Strict) + cookie `admin_session` (vai trò, chỉ để hiển thị UI). Body chỉ có `data.user`.
 */
router.post('/admin/login', validate(loginSchema), ...adminLoginLimits, adminAuthController.loginAdmin)

/**
 * @openapi
 * /api/auth/admin/logout:
 *   post:
 *     summary: Admin & Staff Logout
 *     description: Thu hồi phiên quản trị (đọc từ cookie httpOnly admin_token) và xóa cookie admin_token / admin_session. Luôn thành công, kể cả khi phiên đã hết hạn.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: ADMIN_LOGOUT_SUCCESS
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 */
router.post('/admin/logout', adminAuthController.logoutAdmin)


export default router
