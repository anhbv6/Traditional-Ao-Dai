import { Router } from 'express'
import authRouter from './modules/auth/auth.routes'
import otpRouter from './modules/otp/otp.routes'
import userRouter from './modules/user/user.routes'

const router = Router()

// Mount modules under their prefixes
router.use('/auth/otp', otpRouter)
router.use('/auth', authRouter)
router.use('/user', userRouter)

// Placeholder folders for other modules in the Monolith
// router.use('/products', productRouter)
// router.use('/orders', orderRouter)
// router.use('/payments', paymentRouter)

export default router
