---
name: new-api-module
description: Tạo module REST mới trong apps/api (Express) đúng quy chuẩn dự án — routes/controller/service/schema/KEYS.md, Swagger, rate-limit, mã KEY và bản dịch. Dùng khi thêm endpoint hoặc module backend mới (products, orders, payments...).
---

# Tạo module API mới (`apps/api`)

Quy chuẩn gốc: `docs/PROJECT_RULES.md` §5 (Backend), §6 (Bảo mật). Đọc `apps/api/AGENTS.md` trước.

## 1. Tạo file

```text
apps/api/src/modules/<module>/
├── <module>.routes.ts      # Router + Swagger JSDoc @openapi
├── <module>.controller.ts  # Mỏng: req -> service -> sendSuccess / next(error)
├── <module>.service.ts     # Nghiệp vụ + Prisma (@repo/db)
├── <module>.schema.ts      # Zod { body, query, params }, thông điệp = mã KEY
└── KEYS.md                 # Bảng mã thành công / mã lỗi của module
```

Đăng ký router trong `apps/api/src/routes.ts`: `router.use('/<module>', <module>Router)`.

## 2. Mẫu (theo `modules/otp`)

```ts
// <module>.schema.ts
import { z } from 'zod'
import { vietnamPhoneSchema } from '@repo/shared/validation' // validator dùng chung FE/BE

export const createThingSchema = z.object({
  body: z.object({ name: z.string().trim().min(2, 'NAME_MIN_LENGTH'), phone: vietnamPhoneSchema }),
})
export type CreateThingInput = z.infer<typeof createThingSchema>
```

```ts
// <module>.routes.ts — thứ tự: validate -> rateLimit -> requireAuth -> requireRoles -> controller
import { Router } from 'express'
import * as controller from './<module>.controller'
import { validate } from '../../core/middlewares/validate'
import { rateLimit } from '../../core/middlewares/rateLimit'
import { requireAuth } from '../../core/middlewares/authGuard'
import { createThingSchema } from './<module>.schema'

const router = Router()
/** @openapi ... (summary, mô tả nghiệp vụ, requestBody, LIỆT KÊ mã lỗi theo status) */
router.post('/', validate(createThingSchema), rateLimit({ name: 'thing-create-ip', max: 20, windowSec: 3600 }), requireAuth, controller.createThing)
export default router
```

```ts
// <module>.controller.ts — trả Promise<void>, không dùng any
import { Request, Response, NextFunction } from 'express'
import * as service from './<module>.service'
import { sendSuccess } from '../../core/http/response'

export async function createThing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.createThing(req.body)
    return sendSuccess(res, { data, message: 'THING_CREATED', statusCode: 201 })
  } catch (error) {
    return next(error)
  }
}
```

```ts
// <module>.service.ts
import { prisma } from '@repo/db'
import { toVnd } from '@repo/shared'
import { AppError } from '../../core/http/AppError'

export async function createThing(input: { name: string }) {
  const exists = await prisma.thing.findFirst({ where: { name: input.name } })
  if (exists) throw new AppError(409, 'THING_ALREADY_EXISTS')
  const thing = await prisma.thing.create({ data: input })
  return { ...thing, price: toVnd(thing.price) } // tiền luôn là số nguyên VND, không trả Decimal
}
```

## 3. Checklist bắt buộc
- [ ] Chỉ import từ `core/`, `infra/`, `config/`, `@repo/*` — không import chéo sang module khác (tách logic dùng chung vào `core/`).
- [ ] Endpoint công khai / nhạy cảm (đăng nhập, gửi mã, kiểm tra tài khoản) có `rateLimit`; giới hạn trong service dùng `assertRateLimit` (`core/security/rateLimit.ts`).
- [ ] Thao tác nhiều bảng dùng `prisma.$transaction`.
- [ ] Không trả `password`, token, trường nhạy cảm; không log dữ liệu nhạy cảm.
- [ ] Mọi mã KEY mới → làm theo skill `add-message-key` (KEYS.md + `errors.json` vi/en, mã thành công vào `responses`).
- [ ] Swagger JSDoc đủ mã lỗi theo status (`/api-docs` chỉ ngoài production).
- [ ] `pnpm --filter @repo/api lint` và `pnpm check` xanh; chạy thử `pnpm --filter @repo/api dev` và gọi endpoint.
