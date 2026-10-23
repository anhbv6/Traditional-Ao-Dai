import path from 'path'
import dotenv from 'dotenv'
import { z } from 'zod'

// Local: nạp apps/api/.env.local rồi .env (file trước được ưu tiên, thiếu file thì bỏ qua).
// Production (Render) không có file — biến lấy từ môi trường của dịch vụ.
const API_ROOT = path.resolve(__dirname, '../..')
dotenv.config({ path: [path.join(API_ROOT, '.env.local'), path.join(API_ROOT, '.env')], quiet: true })

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required'),
  // Hạn access token. Hạn refresh token (24h / 7d khi "ghi nhớ") cố định trong modules/auth/client/auth.service.ts
  JWT_EXPIRES_IN: z.string().default('15m'),

  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Số proxy tin cậy đứng trước API và có NỐI IP client vào X-Forwarded-For (nginx/Cloudflare...).
  // Next.js rewrites KHÔNG nối IP nên không tính. Sai số này -> rate-limit theo IP có thể bị giả mạo.
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  
  // Ưu tiên REDIS_URL nếu có (Upstash, Redis Cloud...). Dạng `rediss://` (2 chữ s) tự bật TLS.
  // Bỏ trống thì dùng REDIS_HOST / REDIS_PORT / REDIS_PASSWORD (Redis Docker khi dev).
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Email người gửi (dùng cho cả SMTP và Brevo API) — với Brevo phải là sender đã xác minh
  SMTP_FROM: z.string().default('noreply@aodai.vn'),
  MAIL_FROM_NAME: z.string().default('Áo Dài Truyền Thống'),
  // Brevo HTTP API key (dạng xkeysib-..., KHÔNG phải SMTP key xsmtpsib-...). Có key thì ưu tiên hơn SMTP.
  BREVO_API_KEY: z.string().optional(),
  
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format())
  process.exit(1)
}

export const env = parsed.data
