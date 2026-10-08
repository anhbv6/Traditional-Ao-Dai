# ==========================================
# SHARED CONTRACTS — WORKSPACE RULES (@repo/shared)
# ==========================================

> Quy chuẩn chi tiết: [`docs/PROJECT_RULES.md`](../../docs/PROJECT_RULES.md) — §4 Hợp đồng dữ liệu dùng chung.

# 1. Mục đích
- Nơi duy nhất chứa những gì cả `@repo/api` và `@repo/web` cùng dùng: validator Zod, regex, hằng số nghiệp vụ, kiểu DTO/response, tên cookie phiên, hàm tiện ích thuần (tiền tệ, locale).
- Import: `import { formatVnd, vietnamPhoneSchema, type ApiSuccess } from "@repo/shared"`.

# 2. Quy tắc bắt buộc
- Chỉ code thuần: KHÔNG import Express, Next.js, React, Prisma.
- Giữ **một file entry** `src/index.ts`, KHÔNG import tương đối giữa các file (Node chạy thẳng `.ts` bằng type-stripping cần đuôi `.ts` cho import tương đối — xung đột với `tsc` của API). Nếu cần tách file, dùng `exports` map trong `package.json`.
- KHÔNG dùng `enum` / `namespace` — dùng `as const` + union type.
- Thông điệp lỗi của Zod schema luôn là mã KEY `UPPER_SNAKE_CASE`; thêm mã mới thì bổ sung bản dịch vào `apps/web/messages/*/errors.json`.
- Thay đổi ở đây ảnh hưởng cả FE và BE → chạy `pnpm check` toàn repo.

# 3. Scripts
- `pnpm --filter @repo/shared typecheck`.
