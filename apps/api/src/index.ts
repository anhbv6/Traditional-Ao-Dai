import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './shared/config/swagger'
import { env } from './shared/config/env'
import { prisma } from '@repo/db'
import apiRouter from './routes'
import { errorHandler } from './shared/middlewares/errorHandler'

const app = express()
const PORT = env.PORT

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}))
app.use(express.json())

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
