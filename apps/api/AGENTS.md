# ==========================================
# BACKEND API — WORKSPACE RULES (@repo/api)
# ==========================================

# 1. Kiến trúc: Modular Monolith
- Pattern: Mỗi module trong `src/modules/` chứa: `routes.ts`, `controller.ts`, `service.ts`, `schema.ts`.
- Modules hiện tại: `auth`, `otp`, `user`, `upload`.
- Modules chưa triển khai (placeholder trong `src/routes.ts`): `products`, `orders`, `payments`.
- Shared code nằm trong `src/shared/`: `config/`, `middlewares/`, `types/`, `utils/`.

# 2. Quy chuẩn code
- Framework: Express.js 4 — KHÔNG dùng NestJS, Fastify hoặc framework khác.
- Validation: Dùng Zod v4 cho request validation (`schema.ts` trong mỗi module).
- Auth: JWT (access + refresh tokens), quản lý session qua `UserSession` model.
- Error handling: Sử dụng middleware tập trung trong `src/shared/middlewares/`.
- Database: Import Prisma Client từ `@repo/db` — KHÔNG import trực tiếp từ `@prisma/client`.

# 3. Scripts & Lệnh
- `pnpm --filter @repo/api dev` — Chạy dev với tsx watch.
- `pnpm --filter @repo/api build` — Build TypeScript (output: `dist/`).
- `pnpm --filter @repo/api start` — Chạy production từ `dist/index.js`.

# 4. API Documentation
- Swagger UI có sẵn tại route `/api-docs`.
- Dùng `swagger-jsdoc` để viết docs inline trong code (JSDoc comments).

# 5. Dịch vụ bên ngoài
- **Cloudinary**: Upload ảnh qua Multer → Cloudinary.
- **Redis (ioredis)**: Lưu OTP, quản lý cache.
- **Nodemailer**: Gửi email OTP, hóa đơn qua SMTP.
- **Google OAuth**: Xác thực qua `google-auth-library`.

# 6. Khi tạo module mới
- Tạo thư mục mới trong `src/modules/<tên-module>/`.
- Tạo đủ 4 file: `routes.ts`, `controller.ts`, `service.ts`, `schema.ts`.
- Đăng ký route trong `src/routes.ts`.
- Thêm Swagger JSDoc comments cho mỗi endpoint.
