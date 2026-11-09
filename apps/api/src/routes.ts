import { Router } from 'express'
import authRouter from './modules/auth/auth.routes'
import otpRouter from './modules/otp/otp.routes'
import userRouter from './modules/user/user.routes'
import uploadRouter from './modules/upload/upload.routes'
import ordersRouter from './modules/orders/orders.routes'
import materialsRouter from './modules/materials/materials.routes'

const router = Router()

// Mount modules under their prefixes
router.use('/auth/otp', otpRouter)
router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/upload', uploadRouter)
router.use('/orders', ordersRouter)
router.use('/materials', materialsRouter)

// Placeholder folders for other modules in the Monolith
// router.use('/products', productRouter)
// router.use('/payments', paymentRouter)

export default router
