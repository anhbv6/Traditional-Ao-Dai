# ==========================================
# BACKEND API — WORKSPACE RULES (@repo/api)
# ==========================================

> Quy chuẩn chi tiết: [`docs/PROJECT_RULES.md`](../../docs/PROJECT_RULES.md) — §5 Backend, §6 Xác thực & bảo mật.

# 1. Kiến trúc: Modular Monolith
- Mỗi module trong `src/modules/<module>/` gồm: `<module>.routes.ts`, `.controller.ts`, `.service.ts`, `.schema.ts` (+ `.types.ts`, `KEYS.md`).
- Modules hiện tại: `auth` (client + admin), `otp`, `user` (hồ sơ, địa chỉ, phiên, xác minh email/SĐT), `upload`.
- Modules chưa triển khai: `products`, `orders`, `payments` (placeholder trong `src/routes.ts`).
- Entry: `src/app.ts` (`createApp()` — dựng app, không listen) + `src/server.ts` (listen, tắt êm). Router trung tâm `src/routes.ts`.
- Tầng dùng chung (phụ thuộc một chiều `modules` → `core` / `infra` / `config`):
  - `config/` — `env.ts` (Zod), `swagger.ts`.
  - `infra/` — kết nối dịch vụ ngoài: `redis`, `cloudinary`, `mailer`, `sms`.
  - `core/http/` — `AppError`, `response` (`sendSuccess` / `sendError`).
  - `core/middlewares/` — `authGuard`, `errorHandler`, `requestLogger`, `validate`, `rateLimit` (middleware).
  - `core/security/` — `jwt`, `password`, `session`, `authCookies`, `verificationCode`, `rateLimit` (đếm Redis, `assertRateLimit`).
  - `core/utils/` — hàm thuần: `number`, `phone`, `time`.
- Module lớn chia submodule theo đối tượng dùng: `modules/auth/{client,admin}/` (controller + service riêng, chung routes/schema).

# 2. Quy chuẩn code
- Framework: Express.js 4 — KHÔNG dùng NestJS, Fastify hoặc framework khác.
- Validation: Zod v4 (`schema.ts` dạng `{ body, query, params }`), thông điệp lỗi là **mã KEY**. Dùng validator chung từ `@repo/shared/validation` (SĐT, email, mật khẩu, mã OTP).
- TypeScript strict + ESLint (`eslint.config.mjs` dùng cấu hình chung `@repo/config`): CẤM `any` (controller trả `Promise<void>`, lỗi `catch` để `unknown`); tham số cố ý không dùng đặt tên `_xxx`.
- Thứ tự middleware: `validate` → `rateLimit` → `requireAuth` → `requireRoles` → controller.
- Controller mỏng (đọc req → service → `sendSuccess` / `next(error)`); logic nghiệp vụ ở service.
- Lỗi nghiệp vụ: `throw new AppError(status, 'MA_KEY')`. Phản hồi: `sendSuccess(res, { data, message: 'MA_KEY' })`.
- Database: Import Prisma Client từ `@repo/db` — KHÔNG import trực tiếp từ `@prisma/client`.
- Tiền trả về: số nguyên VND (`toVnd()` từ `@repo/shared`), không trả `Decimal`.

# 3. Tiện ích bắt buộc dùng
- `core/middlewares/rateLimit.ts` — middleware `rateLimit()`; `core/security/rateLimit.ts` — `assertRateLimit()` dùng trong service (Redis). Mọi endpoint công khai nhạy cảm (đăng nhập, OTP, quên mật khẩu, kiểm tra tài khoản) phải có.
- `core/security/verificationCode.ts` — `issueVerificationCode()` / `verifyVerificationCode()`: tối đa 5 lần nhập sai, constant-time, dùng một lần.
- `core/security/authCookies.ts` — nơi DUY NHẤT đặt/xóa cookie phiên (`refreshToken`, `has_session`, `admin_token`, `admin_session`).
- `core/security/session.ts` — `hashToken()`, `cleanupUserSessions()`, `revokeAllUserSessions()`.
- `infra/mailer.ts` — `sendVerificationCodeEmail()`; `infra/sms.ts` — SMS provider (hiện là mock).
- `core/http/AppError.ts` — lỗi nghiệp vụ; `core/http/response.ts` — `sendSuccess()` / `sendError()`.

# 4. Auth
- JWT RS256 (`JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`, cách tạo khóa: `docs/guides/jwt-keys.md`).
- `requireAuth` đọc token từ header Bearer; ngoại lệ duy nhất là cookie `admin_token` (SameSite=Strict). Token ADMIN/STAFF bắt buộc gắn `UserSession` còn hiệu lực.
- Không phân biệt "sai tài khoản/sai mật khẩu" (`INVALID_CREDENTIALS`); quên mật khẩu luôn trả thành công.

# 5. Scripts & Lệnh
- `pnpm --filter @repo/api dev` — Chạy dev (`tsx watch src/server.ts`).
- `pnpm --filter @repo/api typecheck` / `lint` — Kiểm tra type / ESLint (0 lỗi).
- `pnpm --filter @repo/api build` / `start` — `build` chỉ type-check; production chạy thẳng TypeScript bằng `tsx src/server.ts` (`tsx` nằm trong `dependencies`). KHÔNG quay lại `node dist/server.js`: `require('@repo/db')` từ bản build CommonJS không thấy `prisma`.

# 6. API Documentation
- Swagger UI tại `/api-docs` (chỉ ngoài production). Mỗi endpoint phải có JSDoc `@openapi` liệt kê đủ mã lỗi theo status.
- Mỗi mã KEY mới: ghi vào `KEYS.md` của module + thêm bản dịch vi/en vào `apps/web/messages/*/errors.json`.

# 7. Dịch vụ bên ngoài
- **Cloudinary**: Upload ảnh qua Multer (memory) → Cloudinary (`/api/upload`, tối đa 5MB, chỉ ảnh).
- **Redis (ioredis)**: OTP, mã email, reset token, rate-limit, khoảng ân hạn refresh token.
- **Nodemailer**: Gửi email mã xác minh (không cấu hình SMTP thì in ra console).
- **Google OAuth**: `google-auth-library`, bắt buộc `email_verified`.

# 8. Khi tạo module mới
- Tạo thư mục `src/modules/<tên-module>/` với đủ 4 file + `KEYS.md`.
- Đăng ký route trong `src/routes.ts`.
- Thêm Swagger JSDoc, rate-limit cho endpoint công khai, transaction cho thao tác nhiều bảng.
- Chạy `pnpm check` trước khi commit.
