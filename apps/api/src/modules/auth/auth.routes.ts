import { Router } from 'express'
import * as authController from './auth.controller'
import { validate } from '../../shared/middlewares/validate'
import { loginSchema } from './auth.schema'
import { requireAuth } from '../../shared/middlewares/authGuard'

const router = Router()

/**
 * Endpoint for Admin Login (validated using credentials schema)
 */
router.post('/admin/login', validate(loginSchema), authController.loginAdmin)

/**
 * Endpoint for fetching logged-in user profile (requires valid JWT token)
 */
router.get('/me', requireAuth as any, authController.getMe)

export default router
