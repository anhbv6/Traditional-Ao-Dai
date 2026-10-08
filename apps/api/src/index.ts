import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './shared/config/swagger'
import { env } from './shared/config/env'
import { prisma } from '@repo/db'
import apiRouter from './routes'
import { AppError, errorHandler } from './shared/middlewares/errorHandler'
import { requestLogger } from './shared/middlewares/requestLogger'
import { redis } from './shared/utils/redis'

const app = express()
const PORT = env.PORT

// 1. Trust Proxy: số hop proxy tin cậy (xem TRUST_PROXY trong .env.example) để req.ip là IP client thật
app.set('trust proxy', env.TRUST_PROXY)

// 2. Swagger UI (chỉ ngoài production) — mount trước helmet vì Swagger UI cần inline script
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

// 3. Security headers + log request
app.use(helmet())
app.use(requestLogger)

// 4. Whitelist CORS.
// Trình duyệt gọi API qua Next.js rewrites (cùng origin) nên CORS chủ yếu phục vụ công cụ dev gọi thẳng cổng API.
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (như curl, mobile apps, server-to-server) hoặc thuộc whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new AppError(403, 'CORS_ORIGIN_NOT_ALLOWED'))
    },
    credentials: true,
  })
)

// 5. Body parsers (giới hạn kích thước chống payload lớn) & Cookie parser
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))
app.use(cookieParser())

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Retrieve service health status
 *     description: Kiểm tra API cùng kết nối PostgreSQL và Redis. Trả 503 nếu một phụ thuộc không phản hồi.
 *     responses:
 *       503:
 *         description: Database hoặc Redis không phản hồi
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: Node.js Backend API
 */
app.get('/api/health', async (req, res) => {
  const [database, cache] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'down'),
    redis.ping().then(() => 'ok').catch(() => 'down'),
  ])
  const isHealthy = database === 'ok' && cache === 'ok'

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'Node.js Backend API',
    checks: { database, redis: cache },
  })
})

// Centralized API router
app.use('/api', apiRouter)

// Global Error Handler (must be registered last)
app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

// Tắt server êm: ngừng nhận request mới, đóng kết nối DB/Redis rồi thoát
async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`)
  server.close(async () => {
    await Promise.allSettled([prisma.$disconnect(), redis.quit()])
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
