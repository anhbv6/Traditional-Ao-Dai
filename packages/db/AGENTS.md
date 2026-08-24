# ==========================================
# DATABASE LAYER — WORKSPACE RULES (@repo/db)
# ==========================================

# 1. Công nghệ
- ORM: Prisma 5.12 với PostgreSQL.
- Schema: `prisma/schema.prisma`.
- Export: Prisma Client singleton từ `src/index.ts`.
- Các workspace khác import: `import { prisma } from "@repo/db"`.

# 2. Quy trình Prisma (QUAN TRỌNG)
- Sau khi sửa `schema.prisma`, PHẢI chạy theo thứ tự:
  1. `pnpm db:migrate` — Tạo migration mới (từ root).
  2. `pnpm db:generate` — Generate lại Prisma Client (từ root).
- KHÔNG dùng `prisma db push` trong development thông thường (chỉ dùng khi prototyping nhanh).
- Prisma Studio: `pnpm --filter @repo/db studio`.

# 3. Environment
- Package này KHÔNG có `.env` riêng.
- Đọc `DATABASE_URL` từ `apps/api/.env` thông qua `dotenv-cli`.
- Khi chạy lệnh Prisma trực tiếp trong `packages/db`, các script đã tự động load đúng `.env`.

# 4. Schema hiện tại (11 models)
- **User**, **SocialAccount**, **UserSession** — Auth & user management.
- **UserMeasurement**, **UserAddress** — Thông tin khách hàng (số đo Áo Dài, địa chỉ).
- **Category**, **Product**, **ProductVariant** — Sản phẩm & phân loại.
- **Review**, **ReviewMedia** — Đánh giá sản phẩm.
- **Order**, **OrderItem** — Đơn hàng.
- Enums: `Role`, `Gender`, `MediaType`, `OrderStatus`, `PaymentStatus`.

# 5. Seeding
- Seed file: `prisma/seed.ts`.
- Chạy: `pnpm --filter @repo/db seed`.
- Tài khoản admin mặc định: `admin@gmail.com` / `123`.

# 6. Quy tắc khi sửa Schema
- Luôn thêm `@updatedAt` cho trường `updatedAt`.
- Relations phải có explicit foreign key field.
- KHÔNG xóa migration đã tạo — chỉ tạo migration mới để sửa đổi.
