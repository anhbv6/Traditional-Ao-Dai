import { prisma } from '@repo/db'
import { env } from './config/env'
import { redis } from './infra/redis'
import { createApp } from './app'

/**
 * Entry chạy server: mở cổng + tắt êm. Cấu hình ứng dụng nằm ở `app.ts`.
 */
const server = createApp().listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`)
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
