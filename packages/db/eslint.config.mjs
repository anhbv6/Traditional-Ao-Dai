// ESLint cho tầng database — dùng cấu hình Node chung (@repo/config)
import { nodeConfig } from '@repo/config/eslint/base'

export default nodeConfig({ ignores: ['prisma/migrations/**'] })
