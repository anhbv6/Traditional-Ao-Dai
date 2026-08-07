import { Router } from 'express'
import authRouter from './modules/auth/auth.routes'

const router = Router()

// Mount modules under their prefixes
router.use('/auth', authRouter)

// Placeholder folders for other modules in the Monolith
// router.use('/products', productRouter)
// router.use('/orders', orderRouter)
// router.use('/payments', paymentRouter)

export default router
