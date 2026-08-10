import { Router } from 'express'
import * as authController from './auth.controller'
import { validate } from '../../shared/middlewares/validate'
import { loginSchema } from './auth.schema'
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
router.post('/admin/login', validate(loginSchema), authController.loginAdmin)

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
 *                       example: admin
 *       401:
 *         description: Unauthorized - JWT token missing, invalid or expired
 */
router.get('/me', requireAuth as any, authController.getMe)

export default router
