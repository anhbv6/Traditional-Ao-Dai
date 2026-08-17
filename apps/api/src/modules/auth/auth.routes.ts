import { Router } from 'express'
import * as adminAuthController from './admin/auth.controller'
import * as clientAuthController from './client/auth.controller'
import { validate } from '../../shared/middlewares/validate'
import { loginSchema, registerSchema, checkAccountSchema } from './auth.schema'
import { requireAuth } from '../../shared/middlewares/authGuard'

const router = Router()

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Client Register
 *     description: Register a new customer account.
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
 *                 example: newuser@aodai.vn
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *               name:
 *                 type: string
 *                 example: "Nguyen Van A"
 *               phone:
 *                 type: string
 *                 example: "0987654321"
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
 *                   example: Đăng ký tài khoản thành công
 *       400:
 *         description: Validation error or account already exists
 */
router.post('/register', validate(registerSchema), clientAuthController.registerClient)

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
 *                   example: Đăng nhập Admin thành công
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

/**
 * @openapi
 * /api/auth/client/login:
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
 *                   example: Đăng nhập thành công
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
router.post('/client/login', validate(loginSchema), clientAuthController.loginClient)
router.post('/login', validate(loginSchema), clientAuthController.loginClient)

/**
 * @openapi
 * /api/auth/client/refresh-token:
 *   post:
 *     summary: Refresh Client Token
 *     description: Rotate a valid refresh token and return a new access token and refresh token pair.
 *     tags:
 *       - Auth
 */
router.post('/client/refresh-token', clientAuthController.refreshClientToken)
router.post('/refresh', clientAuthController.refreshClientToken)

/**
 * @openapi
 * /api/auth/client/logout:
 *   post:
 *     summary: Client Logout
 *     description: Revoke the current customer session.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 */
router.post('/client/logout', clientAuthController.logoutClient)
router.post('/logout', clientAuthController.logoutClient)

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
router.get('/client/me', requireAuth as any, clientAuthController.getMe)
router.put('/client/profile', requireAuth as any, clientAuthController.updateProfile)

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

export default router
