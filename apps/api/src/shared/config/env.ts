import dotenv from 'dotenv'
import { z } from 'zod'

// Ensure env files are loaded
dotenv.config()

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required'),
  JWT_EXPIRES_IN: z.string().min(1, 'JWT_EXPIRES_IN is required').default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1, 'JWT_REFRESH_EXPIRES_IN is required').default('7d'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform((val) => parseInt(val, 10)).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  OTP_TTL_SECONDS: z.string().transform((val) => parseInt(val, 10)).default(300),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format())
  process.exit(1)
}

export const env = parsed.data
