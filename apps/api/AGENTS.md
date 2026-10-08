# ==========================================
# BACKEND API — WORKSPACE RULES (@repo/api)
# ==========================================

> Quy chuẩn chi tiết: [`docs/PROJECT_RULES.md`](../../docs/PROJECT_RULES.md) — §5 Backend, §6 Xác thực & bảo mật.

# 1. Kiến trúc: Modular Monolith
- Mỗi module trong `src/modules/<module>/` gồm: `<module>.routes.ts`, `.controller.ts`, `.service.ts`, `.schema.ts` (+ `.types.ts`, `KEYS.md`).
- Modules hiện tại: `auth` (client + admin), `otp`, `user` (hồ sơ, địa chỉ, phiên, xác minh email/SĐT), `upload`.
- Modules chưa triển khai: `products`, `orders`, `payments` (placeholder trong `src/routes.ts`).
- Shared code nằm trong `src/shared/`: `config/` (env Zod, swagger), `middlewares/` (authGuard, errorHandler, validate, requestLogger), `utils/`.

# 2. Quy chuẩn code
- Framework: Express.js 4 — KHÔNG dùng NestJS, Fastify hoặc framework khác.
- Validation: Zod v4 (`schema.ts` dạng `{ body, query, params }`), thông điệp lỗi là **mã KEY**. Dùng validator chung từ `@repo/shared` (SĐT, email, mật khẩu, mã OTP).
- Thứ tự middleware: `validate` → `rateLimit` → `requireAuth` → `requireRoles` → controller.
- Controller mỏng (đọc req → service → `sendSuccess` / `next(error)`); logic nghiệp vụ ở service.
- Lỗi nghiệp vụ: `throw new AppError(status, 'MA_KEY')`. Phản hồi: `sendSuccess(res, { data, message: 'MA_KEY' })`.
- Database: Import Prisma Client từ `@repo/db` — KHÔNG import trực tiếp từ `@prisma/client`.
- Tiền trả về: số nguyên VND (`toVnd()` từ `@repo/shared`), không trả `Decimal`.

# 3. Tiện ích bắt buộc dùng (`src/shared/utils/`)
- `rateLimit.ts` — `rateLimit()` middleware / `assertRateLimit()` (Redis). Mọi endpoint công khai nhạy cảm (đăng nhập, OTP, quên mật khẩu, kiểm tra tài khoản) phải có.
- `verificationCode.ts` — `issueVerificationCode()` / `verifyVerificationCode()`: tối đa 5 lần nhập sai, constant-time, dùng một lần.
- `authCookies.ts` — nơi DUY NHẤT đặt/xóa cookie phiên (`refreshToken`, `has_session`, `admin_token`, `admin_session`).
- `session.ts` — `hashToken()`, `cleanupUserSessions()`, `revokeAllUserSessions()`.
- `mail.ts` — `sendVerificationCodeEmail()`; `sms.ts` — SMS provider (hiện là mock).

# 4. Auth
- JWT RS256 (`JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`, xem `configJWT.md`).
- `requireAuth` đọc token từ header Bearer; ngoại lệ duy nhất là cookie `admin_token` (SameSite=Strict). Token ADMIN/STAFF bắt buộc gắn `UserSession` còn hiệu lực.
- Không phân biệt "sai tài khoản/sai mật khẩu" (`INVALID_CREDENTIALS`); quên mật khẩu luôn trả thành công.

# 5. Scripts & Lệnh
- `pnpm --filter @repo/api dev` — Chạy dev với tsx watch.
- `pnpm --filter @repo/api typecheck` — Kiểm tra type.
- `pnpm --filter @repo/api build` / `start` — Build (`dist/`) và chạy production.

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
