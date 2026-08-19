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

const router = Router()

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
 *         description: Validation error or account already exists
 */
router.post('/register', validate(registerSchema), clientAuthController.register)

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Client Login
 *     description: Authenticate customers using email or phone and password. Returns an access token, refresh token, and creates a user session.
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
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshTokenExpiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), clientAuthController.login)

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
 *         description: Validation error or user not found
 *       401:
 *         description: Invalid OTP
 */
router.post('/login/otp', validate(otpLoginSchema), clientAuthController.loginWithOtp)

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
 *         description: Validation error or invalid Google token
 *       403:
 *         description: Forbidden - Account locked or de-activated
 */
router.post('/google', validate(googleLoginSchema), clientAuthController.loginWithGoogle)

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
 *       404:
 *         description: Email not found
 *       429:
 *         description: Cooldown active
 */
router.post('/forgot-password/email', validate(forgotPasswordEmailSchema), clientAuthController.forgotPasswordEmail)

router.post('/forgot-password/email/verify', validate(verifyResetPasswordEmailSchema), clientAuthController.verifyResetPasswordEmail)

router.post('/forgot-password/phone/verify', validate(verifyResetPasswordPhoneSchema), clientAuthController.verifyResetPasswordPhone)

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
router.post('/reset-password/email', validate(resetPasswordEmailSchema), clientAuthController.resetPasswordEmail)

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
router.post('/reset-password/phone', validate(resetPasswordPhoneSchema), clientAuthController.resetPasswordPhone)


/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh Client Token
 *     description: Rotate a valid refresh token and return a new access token and refresh token pair.
 *     tags:
 *       - Auth
 */
router.post('/refresh-token', clientAuthController.refreshToken)

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
 *                   example: Account availability checked successfully
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
router.get('/check-account', validate(checkAccountSchema), clientAuthController.checkAccount)

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
router.get('/me', requireAuth as any, clientAuthController.getMe)

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Client Logout
 *     description: Revoke the current customer session.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', clientAuthController.logout)




router.put('/client/profile', requireAuth as any, clientAuthController.updateProfile)

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
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/admin/login', validate(loginSchema), adminAuthController.loginAdmin)


export default router
