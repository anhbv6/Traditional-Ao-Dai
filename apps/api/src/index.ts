import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './shared/config/swagger'
import { env } from './shared/config/env'
import { prisma } from '@repo/db'
import apiRouter from './routes'
import { errorHandler } from './shared/middlewares/errorHandler'

const app = express()
const PORT = env.PORT

// 1. Trust Proxy: Nhận diện đúng IP Client thật và giao thức HTTPS khi deploy sau Nginx/Vercel/Cloudflare
app.set('trust proxy', 1)

// 2. Whitelist CORS chặt chẽ và bảo mật
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
      return callback(new Error('Blocked by CORS policy'))
    },
    credentials: true,
  })
)

// 3. Body parsers & Cookie parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Retrieve service health status
 *     description: Returns the status and name of the running API service.
 *     responses:
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Node.js Backend API' })
})

// Mount Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Centralized API router
app.use('/api', apiRouter)

// Global Error Handler (must be registered last)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
