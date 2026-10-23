# Rule agent — `apps/api` (Express)

Bản rút gọn cho agent. Quy chuẩn đầy đủ: [`AGENTS.md`](../../AGENTS.md) gốc — §5 Backend, §6 Bảo mật, §4 định dạng response.

- Module mới trong `src/modules/<module>/`: `routes` (Swagger `@openapi` đủ mã lỗi) → `controller` (mỏng, `next(error)`) → `service` (nghiệp vụ + Prisma) · `schema` (Zod, thông điệp là mã KEY) · `KEYS.md`. Đăng ký ở `src/routes.ts`. Dùng skill `new-api-module`.
- Middleware: `validate` → `rateLimit` → `requireAuth` (Bearer, `aud=store`) hoặc `requireAnyAuth` (thêm cookie `admin_token`) → `requireRoles`.
- Lỗi `throw new AppError(status, 'MA_KEY')`; thành công `sendSuccess(...)`. KEY mới: `KEYS.md` + dịch vi/en trong `apps/web/messages/*/errors.json` (skill `add-message-key`).
- Dùng sẵn, không viết lại: `rateLimit`/`assertRateLimit`, `issue|verifyVerificationCode`, `authCookies.ts` (nơi duy nhất đặt cookie phiên), `session.ts`, `toUserDto()`, `sendVerificationCodeEmail`.
- Import Prisma từ `@repo/db`. Tiền trả số nguyên VND (`toVnd`). Không `any`, không log mật khẩu/token/OTP.
- Production chạy `tsx src/server.ts` (`build` chỉ type-check) — không quay lại `node dist`.
