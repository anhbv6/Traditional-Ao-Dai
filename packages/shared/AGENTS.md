# ==========================================
# SHARED CONTRACTS — WORKSPACE RULES (@repo/shared)
# ==========================================

> Quy chuẩn chi tiết: [`docs/PROJECT_RULES.md`](../../docs/PROJECT_RULES.md) — §4 Hợp đồng dữ liệu dùng chung.

# 1. Mục đích
- Nơi duy nhất chứa những gì cả `@repo/api` và `@repo/web` cùng dùng: validator Zod, regex, hằng số nghiệp vụ, kiểu DTO/response, tên cookie phiên, hàm tiện ích thuần (tiền tệ, locale).
- Hai entry:
  - `@repo/shared` — hằng số, kiểu, tiện ích thuần (`AUTH_COOKIES`, `formatVnd`, `toVnd`, `pickLocalized`, `normalizeVietnamPhone`, `type ApiSuccess`...). **KHÔNG import zod** để trang không validate khỏi tải zod.
  - `@repo/shared/validation` — validator Zod + regex/hằng số độ dài (`vietnamPhoneSchema`, `emailSchema`, `VIETNAM_PHONE_REGEX`...).

# 2. Quy tắc bắt buộc
- Chỉ code thuần: KHÔNG import Express, Next.js, React, Prisma.
- Mỗi entry là **một file**, KHÔNG import tương đối giữa các file (Node chạy thẳng `.ts` bằng type-stripping cần đuôi `.ts` cho import tương đối — xung đột với `tsc` của API). Entry mới: thêm vào `exports` VÀ `typesVersions` (API dùng `module: commonjs` nên TypeScript chỉ đọc `typesVersions`).
- `"sideEffects": false` — không viết lệnh chạy ở cấp module.
- KHÔNG dùng `enum` / `namespace` — dùng `as const` + union type.
- Thông điệp lỗi của Zod schema luôn là mã KEY `UPPER_SNAKE_CASE`; thêm mã mới thì bổ sung bản dịch vào `apps/web/messages/*/errors.json`.
- Thay đổi ở đây ảnh hưởng cả FE và BE → chạy `pnpm check` toàn repo.

# 3. Scripts
- `pnpm --filter @repo/shared typecheck` / `lint` (ESLint dùng `nodeConfig()` của `@repo/config`).
