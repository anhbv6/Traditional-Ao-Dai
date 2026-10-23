# Rule agent — `packages/db` (Prisma)

Bản rút gọn cho agent. Quy chuẩn đầy đủ: [`AGENTS.md`](../../AGENTS.md) gốc — §9 Database (schema, migration, seed).

- Workspace khác import `import { prisma, type Prisma } from "@repo/db"` — không import `@prisma/client`. Seed import từ `../../src`.
- Không có env riêng — script `pnpm db:*` đọc `apps/api/.env.local` rồi `apps/api/.env` qua `dotenv-cli` (biến đặt sẵn trong terminal, vd. `$env:DATABASE_URL`, được ưu tiên hơn file).
- Sửa schema → tạo migration MỚI (không sửa/xóa migration cũ, không `db push`, không `prisma format` cả file) → `pnpm db:generate` (Windows: dừng `pnpm dev` trước).
- Không interactive (agent): `prisma migrate diff --from-schema-datamodel <cũ> --to-schema-datamodel prisma/schema.prisma --script`, viết tay khi cần giữ dữ liệu, chạy thử trong `BEGIN ... ROLLBACK` rồi `pnpm db:deploy`.
- Quy ước: `id` uuid, `createdAt`/`updatedAt`, khóa ngoại + `@@index`, tiền `Decimal(12, 2)`, đa ngôn ngữ cột `<field>En`, email lưu chữ thường.
- Seed (`prisma/seed/`) idempotent, không in mật khẩu, demo tắt bằng `SEED_DEMO_DATA=false`. `pnpm --filter @repo/db typecheck` kiểm tra cả seed.
