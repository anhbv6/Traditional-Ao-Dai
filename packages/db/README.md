# 🗄️ @repo/db — Database Layer

Prisma ORM 5 + PostgreSQL. Cung cấp Prisma Client cho `apps/api` và khu admin của `apps/web`.

```ts
import { prisma } from '@repo/db'   // KHÔNG import thẳng từ @prisma/client
```

## Cấu hình

Không có `.env` riêng — mọi lệnh Prisma đọc `DATABASE_URL` từ `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public"
```

## Khởi tạo lần đầu

```bash
pnpm install        # tự chạy prisma generate
pnpm db:deploy      # tạo bảng từ migration có sẵn
pnpm db:seed        # admin + danh mục, sản phẩm, đơn, lịch hẹn, vải mẫu
```

Seed chạy lại nhiều lần không lỗi (dùng `upsert`). Admin mặc định `admin@gmail.com` / `admin123` — đổi qua `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_PHONE`.

## Sửa schema

1. Sửa [`prisma/schema.prisma`](prisma/schema.prisma).
2. Tạo migration: `pnpm db:migrate --name add_discount_to_product`.
3. Sinh lại client: `pnpm db:generate`.

- ⚠️ **Windows:** dừng `pnpm dev` trước khi generate (lỗi `EPERM`).
- ⚠️ **Không sửa/xóa migration đã áp dụng** — luôn tạo migration mới.
- 🤖 **Môi trường không interactive** (CI, AI agent) — `migrate dev` từ chối chạy. Sinh SQL thủ công (trong `packages/db`):
  ```bash
  prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
  ```
  Lưu vào `prisma/migrations/<timestamp>_<ten>/migration.sql`, xem lại rồi `pnpm db:deploy`.

## Quy ước schema

- `id String @id @default(uuid())`, luôn có `createdAt` / `updatedAt @updatedAt`, khóa ngoại kèm `@@index`.
- **Tiền:** `Decimal @db.Decimal(12, 2)`; trả ra ngoài bằng `toVnd()` của `@repo/shared`.
- **Đa ngôn ngữ:** cột gốc tiếng Việt (bắt buộc) + cột hậu tố `En` (nullable), ví dụ `name` / `nameEn`. Đọc bằng `pickLocalized(entity, 'name', locale)`.
- Chi tiết: [`AGENTS.md`](AGENTS.md), [`PROJECT_RULES.md` §9](../../docs/PROJECT_RULES.md#9-database-packagesdb).

## Lệnh (chạy ở thư mục gốc)

| Lệnh | Tác dụng |
| :--- | :--- |
| `pnpm db:generate` | Sinh Prisma Client |
| `pnpm db:migrate --name <ten>` | Tạo + áp migration (dev) |
| `pnpm db:deploy` | Áp migration có sẵn (production / CI) |
| `pnpm db:seed` | Seed dữ liệu mẫu |
| `pnpm db:studio` | Giao diện xem/sửa dữ liệu — http://localhost:5555 |
| `pnpm --filter @repo/db db:push` | Đẩy schema không tạo migration (chỉ prototype) |
