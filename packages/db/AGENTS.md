# ==========================================
# DATABASE LAYER — WORKSPACE RULES (@repo/db)
# ==========================================

> Quy chuẩn chi tiết: [`docs/PROJECT_RULES.md`](../../docs/PROJECT_RULES.md) — §9 Database.

# 1. Công nghệ
- ORM: Prisma 5 với PostgreSQL.
- Schema: `prisma/schema.prisma`.
- Export: Prisma Client singleton từ `src/index.ts` (export thẳng file `.ts`, cần Node ≥ 22.18).
- Các workspace khác import: `import { prisma } from "@repo/db"` (kiểu: `import { type Prisma, type Role } from "@repo/db"`).

# 2. Quy trình Prisma (QUAN TRỌNG)
- Sau khi sửa `schema.prisma`:
  1. `pnpm db:migrate --name <ten_thay_doi>` — Tạo + áp dụng migration (terminal interactive).
     - Môi trường không interactive: `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` vào thư mục `prisma/migrations/<timestamp>_<ten>/migration.sql`, xem lại SQL, rồi `pnpm db:deploy`.
  2. `pnpm db:generate` — Generate lại Prisma Client (Windows: dừng dev server trước, nếu không sẽ lỗi `EPERM`).
- KHÔNG dùng `prisma db push` trong development thông thường (chỉ dùng khi prototyping nhanh).
- KHÔNG chạy `prisma format` cho cả file khi chỉ sửa vài dòng (tạo diff căn lề rất lớn).
- Prisma Studio: `pnpm db:studio`.

# 3. Environment
- Package này KHÔNG có `.env` riêng.
- Đọc `DATABASE_URL` từ `apps/api/.env` thông qua `dotenv-cli`.
- Khi chạy lệnh Prisma trực tiếp trong `packages/db`, các script đã tự động load đúng `.env`.

# 4. Schema hiện tại (22 models)
- **Auth & người dùng:** `User`, `AuthToken`, `SocialAccount`, `UserSession` (refresh token dạng hash, `familyId` phát hiện dùng lại), `UserAddress`, `UserMeasurement` (số đo áo dài).
- **Catalog:** `Category`, `Product`, `ProductVariant`.
- **Giỏ hàng & đơn hàng:** `Cart`, `CartItem`, `Voucher`, `Order`, `OrderItem` (snapshot sản phẩm + số đo), `TailoringLog` (nhật ký may đo).
- **Đánh giá:** `Review`, `ReviewMedia`.
- **Vận hành:** `StaffPermission`, `ApprovalRequest`, `Article`, `Faq`.
- Enums: `Role`, `MediaType`, `OrderStatus`, `TailoringStatus`, `PaymentStatus`, `ApprovalStatus`, `DiscountType`.

# 5. Seeding
- Seed file: `prisma/seed.ts`. Chạy: `pnpm db:seed`.
- Tài khoản admin mặc định: `admin@gmail.com` / `admin123` (đổi qua `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

# 6. Quy tắc khi sửa Schema
- `id String @id @default(uuid())`; luôn có `createdAt @default(now())` và `updatedAt @updatedAt`.
- Relations phải có explicit foreign key field; thêm `@@index` cho cột lọc/khóa ngoại thường dùng.
- Tiền: `Decimal @db.Decimal(12, 2)`; khi trả ra ngoài tầng dữ liệu chuyển bằng `toVnd()` (`@repo/shared`).
- Nội dung đa ngôn ngữ: cột gốc = tiếng Việt, cột `<field>En` = tiếng Anh (nullable); đọc bằng `pickLocalized()`.
- KHÔNG xóa/sửa migration đã tạo — chỉ tạo migration mới để sửa đổi.
