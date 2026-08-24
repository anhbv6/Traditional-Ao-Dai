<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ==========================================
# CENTRAL ARCHITECTURE & MONOREPO CONFIG
# ==========================================

# 1. Dự án & Công nghệ cốt lõi (Monorepo Context)
- Tên dự án: "Traditional Ao Dai" — E-commerce bán Áo Dài truyền thống Việt Nam.
- Mô hình dự án: Monorepo quản lý bằng [pnpm].
- Ngôn ngữ lập trình: TypeScript toàn bộ (strict mode).
- Thư mục workspace:
  - `apps/api`: Backend REST API (Express.js 4, TypeScript 5.9).
  - `apps/web`: Frontend (Next.js 16 App Router, React 19).
  - `packages/db`: Database layer (Prisma ORM 5.12, PostgreSQL).

# 2. Tech Stack tổng quan
- **Frontend:** Next.js 16 (App Router, RSC), React 19, Tailwind CSS v4, shadcn/ui, TanStack React Query v5, Zustand v5, React Hook Form + Zod v4, next-intl (i18n: vi + en), Framer Motion 12.
- **Backend:** Express.js 4, JWT (access + refresh tokens), bcryptjs, Google OAuth, Cloudinary + Multer (upload), Nodemailer (email/OTP), Swagger (API docs tại `/api-docs`), ioredis (Redis client), Zod v4 (validation).
- **Database:** PostgreSQL qua Prisma ORM 5.12, Redis 7 (Docker) cho cache/OTP.
- **Infrastructure:** Docker Compose (chỉ Redis), pnpm workspaces.

# 3. Quy tắc sử dụng Terminal & Cài đặt Package (Crucial)
- TUYỆT ĐỐI KHÔNG sử dụng `npm install` hoặc `yarn install`. Chỉ dùng `pnpm`.
- Cài package cho workspace cụ thể: `pnpm --filter @repo/web add <package>` hoặc `pnpm --filter @repo/api add <package>`.
- Scripts chính từ root:
  - `pnpm dev` — Chạy dev tất cả workspaces song song.
  - `pnpm build` — Build tất cả workspaces.
  - `pnpm db:generate` — Generate Prisma Client.
  - `pnpm db:migrate` — Chạy Prisma migration.

# 4. Quy tắc về Environment Variables
- TUYỆT ĐỐI KHÔNG commit file `.env`. Chỉ commit `.env.example`.
- Backend: `apps/api/.env` (PostgreSQL, Redis, JWT, SMTP, Cloudinary, Google OAuth).
- Frontend: `apps/web/.env` (API URL, Google Client ID).
- Database (packages/db): Đọc `.env` từ `apps/api/.env` thông qua `dotenv-cli` — KHÔNG cần `.env` riêng.

# 5. Quy trình làm việc tự động (Agentic Workflow Rules)
- **Tự động kiểm tra**: Sau khi tạo mới hoặc sửa đổi code ở bất kỳ workspace nào, bạn phải chạy lệnh build hoặc check type của workspace đó.
- **Xử lý lỗi Terminal**: Nếu lệnh terminal trả về mã lỗi (exit code khác 0), hãy tự động đọc log lỗi, phân tích nguyên nhân, tự sửa code và chạy lại. Bạn có tối đa 2 lần thử tự sửa trước khi dừng lại hỏi người dùng.

# 6. Tiêu chuẩn Git & Commit (Git Conventions)
- TUYỆT ĐỐI KHÔNG tự động chạy lệnh `git push` lên nhánh `main` hoặc `master`. Hãy dừng lại sau khi commit để người dùng kiểm tra.
- TUYỆT ĐỐI KHÔNG tự động chạy lệnh `git add .`.

# 7. Quy tắc ngôn ngữ
- Comments, docs, commit messages: Tiếng Việt.
- Tên biến, hàm, class, interface: Tiếng Anh.

# 8. Phân cấp Rule (Rule Hierarchy)
- Đây là file quy tắc chung của toàn bộ Monorepo.
- Khi làm việc sâu bên trong các thư mục con (`apps/api`, `apps/web`, `packages/db`), bạn bắt buộc phải đọc và kết hợp với file `AGENTS.md` nằm riêng trong từng thư mục đó.
