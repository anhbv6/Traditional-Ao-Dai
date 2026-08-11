import { Router } from 'express'
import * as adminAuthController from './admin/auth.controller'
import * as clientAuthController from './client/auth.controller'
import { validate } from '../../shared/middlewares/validate'
import { loginSchema, registerSchema } from './auth.schema'
import { requireAuth } from '../../shared/middlewares/authGuard'

const router = Router()

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
 *     description: Authenticate customers using email and password. Returns a JWT access token.
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
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/client/login', validate(loginSchema), clientAuthController.loginClient)

/**
 * @openapi
 * /api/auth/client/register:
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
router.post('/client/register', validate(registerSchema), clientAuthController.registerClient)

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

export default router
