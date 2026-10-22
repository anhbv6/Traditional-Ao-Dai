# ⚙️ @repo/api — Backend REST API

Express 4 + TypeScript, kiến trúc **Modular Monolith**. Phục vụ Storefront qua `/api/*` (Next.js rewrites chuyển tiếp sang đây).

## Chạy

```bash
docker compose up -d          # Redis (từ thư mục gốc)
pnpm --filter @repo/api dev   # http://localhost:3001
```

- Health: `GET /api/health` (kiểm tra DB + Redis)
- Swagger: `/api-docs` (tắt khi `NODE_ENV=production`)
- Env: `apps/api/.env` — copy từ `.env.example`

## Cấu trúc

```text
src/
├── server.ts     # Entry: listen + graceful shutdown
├── app.ts        # createApp(): helmet, CORS, health, router, error handler
├── routes.ts     # Gắn router các module
├── config/       # env (Zod), swagger
├── infra/        # redis, cloudinary, mailer, sms
├── core/
│   ├── http/         # AppError, sendSuccess
│   ├── middlewares/  # authGuard, validate, rateLimit, errorHandler, requestLogger
│   ├── security/     # jwt, session, authCookies, verificationCode
│   └── utils/
└── modules/      # auth, otp, user, upload
```

Mỗi module: `*.routes.ts` (endpoint + Swagger) → `*.controller.ts` (mỏng) → `*.service.ts` (nghiệp vụ + Prisma) · `*.schema.ts` (Zod) · `KEYS.md` (mã phản hồi).

## Quy ước

- Response thống nhất: `{ status, statusCode, message: "MA_KEY", data, meta }`.
- `message` luôn là mã `UPPER_SNAKE_CASE`; FE dịch ở `apps/web/messages/<locale>/errors.json`.
- Lỗi nghiệp vụ: `throw new AppError(...)`; input validate bằng Zod qua middleware `validate`.
- Thêm module mới: dùng skill `new-api-module`. Chi tiết: [`AGENTS.md`](AGENTS.md), [`PROJECT_RULES.md`](../../docs/PROJECT_RULES.md).

## Lệnh

| Lệnh | Tác dụng |
| :--- | :--- |
| `pnpm --filter @repo/api dev` | Dev (tsx watch) |
| `pnpm --filter @repo/api build` | Type-check (không sinh `dist/`) |
| `pnpm --filter @repo/api start` | Chạy production bằng `tsx src/server.ts` |
| `pnpm --filter @repo/api typecheck` / `lint` | Kiểm tra |
