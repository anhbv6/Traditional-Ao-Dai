import express from 'express'
import cors from 'cors'
import { env } from './shared/config/env'
import { prisma } from '@repo/db'
import apiRouter from './routes'
import { errorHandler } from './shared/middlewares/errorHandler'

const app = express()
const PORT = env.PORT

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Node.js Backend API' })
})

// Centralized API router
app.use('/api', apiRouter)

// Global Error Handler (must be registered last)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
