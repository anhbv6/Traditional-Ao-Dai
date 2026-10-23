# Rule agent — `packages/shared` (hợp đồng FE ↔ BE)

Bản rút gọn cho agent. Quy chuẩn đầy đủ: [`AGENTS.md`](../../AGENTS.md) gốc — §4.

- Chỉ đặt thứ CẢ FE và BE cùng dùng. Chỉ code thuần — không import Express, Next.js, React, Prisma.
- `@repo/shared` (`src/index.ts`) KHÔNG import zod; validator Zod ở `@repo/shared/validation` (`src/validation.ts`).
- Mỗi entry một file, không import tương đối; entry mới khai báo cả `exports` lẫn `typesVersions`. Không `enum`/`namespace` (dùng `as const`). `"sideEffects": false`.
- Thông điệp lỗi Zod là mã KEY — thêm bản dịch ở `apps/web/messages/*/errors.json`.
- Thay đổi ảnh hưởng cả FE và BE → chạy `pnpm check` toàn repo.
