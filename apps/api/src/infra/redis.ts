import Redis from 'ioredis'
import { env } from '../config/env'

// REDIS_URL dạng `rediss://` -> ioredis tự bật TLS (bắt buộc với Upstash)
export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL)
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
    })

redis.on('connect', () => {
  console.log('📝 Redis connected successfully')
})

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err)
})
