# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
# ==========================================
# CENTRAL ARCHITECTURE & MONOREPO CONFIG
# ==========================================

> 📐 **Quy chuẩn đầy đủ:** [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md) — BẮT BUỘC đọc trước khi viết code. File này chỉ là bản tóm tắt.

# 1. Dự án & Công nghệ cốt lõi (Monorepo Context)
- Tên dự án: "Traditional Ao Dai" — E-commerce bán Áo Dài truyền thống Việt Nam (có dịch vụ may đo theo số đo).
- Mô hình dự án: Monorepo quản lý bằng [pnpm]. Node.js ≥ 22.18 (khuyến nghị 24).
- Ngôn ngữ lập trình: TypeScript toàn bộ (strict mode, không dùng `any`).
- Thư mục workspace:
  - `apps/api`: Backend REST API (Express.js 4, TypeScript 5.9).
  - `apps/web`: Frontend Storefront + Admin (Next.js 16 App Router, React 19).
  - `packages/db`: Database layer (Prisma ORM 5, PostgreSQL).
  - `packages/shared`: Hợp đồng dữ liệu dùng chung FE/BE (validator Zod, kiểu response, tên cookie, tiền tệ, locale).

# 2. Kiến trúc tổng quan
- Trình duyệt gọi `/api/*` trên domain web → Next.js rewrites chuyển tiếp sang Express (**cùng origin**, cookie httpOnly dùng chung).
- **Storefront** lấy dữ liệu qua Express API. **Admin** dùng Server Components + Server Actions gọi Prisma trực tiếp (KHÔNG tạo endpoint `/api/admin/*`).
- Auth: khách hàng = access token trong bộ nhớ + refresh token cookie httpOnly; admin = cookie httpOnly `admin_token` (SameSite=Strict). Mọi phiên lưu ở bảng `UserSession`, thu hồi được.

# 3. Tech Stack tổng quan
- **Frontend:** Next.js 16 (App Router, RSC), React 19, Tailwind CSS v4, shadcn/ui + Base UI, TanStack React Query v5, Zustand v5, React Hook Form + Zod v4, next-intl (vi + en), Motion 12.
- **Backend:** Express.js 4, JWT RS256 (access + refresh), bcryptjs, Google OAuth, Cloudinary + Multer, Nodemailer, Swagger (`/api-docs`, chỉ ngoài production), ioredis, Zod v4, helmet.
- **Database:** PostgreSQL qua Prisma ORM, Redis 7 (Docker) cho OTP, rate-limit, reset token.
- **Infrastructure:** Docker Compose (chỉ Redis), pnpm workspaces, GitHub Actions CI (`typecheck` + `lint`).

# 4. Quy tắc sử dụng Terminal & Cài đặt Package (Crucial)
- TUYỆT ĐỐI KHÔNG sử dụng `npm install` hoặc `yarn install`. Chỉ dùng `pnpm`.
- Cài package cho workspace cụ thể: `pnpm --filter @repo/web add <package>` hoặc `pnpm --filter @repo/api add <package>`.
- Scripts chính từ root:
  - `pnpm dev` — Chạy dev tất cả workspaces song song.
  - `pnpm check` — `typecheck` + `lint` toàn repo (bắt buộc xanh trước khi commit).
  - `pnpm build` — Build tất cả workspaces.
  - `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:deploy` / `pnpm db:seed` / `pnpm db:studio`.

# 5. Quy tắc về Environment Variables
- TUYỆT ĐỐI KHÔNG commit file `.env`. Chỉ commit `.env.example` (mọi biến mới phải thêm vào đây kèm comment).
- Backend: `apps/api/.env` (PostgreSQL, Redis, JWT key pair, SMTP, Cloudinary, Google OAuth, `TRUST_PROXY`).
- Frontend: `apps/web/.env` (`NEXT_PUBLIC_API_URL="/api"`, `API_INTERNAL_URL`, `JWT_PUBLIC_KEY` — chỉ public key, Google Client ID).
- Database (packages/db): Đọc `.env` từ `apps/api/.env` thông qua `dotenv-cli` — KHÔNG cần `.env` riêng.

# 6. Quy trình làm việc tự động (Agentic Workflow Rules)
- **Tự động kiểm tra**: Sau khi tạo mới hoặc sửa đổi code, chạy `pnpm check` (hoặc `pnpm --filter <workspace> typecheck` / `lint`).
- **Xử lý lỗi Terminal**: Nếu lệnh terminal trả về mã lỗi (exit code khác 0), hãy tự động đọc log lỗi, phân tích nguyên nhân, tự sửa code và chạy lại. Bạn có tối đa 2 lần thử tự sửa trước khi dừng lại hỏi người dùng.
- **Sau khi sửa schema Prisma**: tạo migration mới (không sửa migration cũ), rồi `pnpm db:generate` (Windows: dừng dev server trước).

# 7. Tiêu chuẩn Git & Commit (Git Conventions)
- TUYỆT ĐỐI KHÔNG tự động chạy lệnh `git push` lên nhánh `main` hoặc `master`. Hãy dừng lại sau khi commit để người dùng kiểm tra.
- TUYỆT ĐỐI KHÔNG tự động chạy lệnh `git add .` — chỉ add đúng file đã sửa.
- Commit message tiếng Việt với tiền tố `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.

# 8. Quy tắc ngôn ngữ
- Comments, docs, commit messages: Tiếng Việt.
- Tên biến, hàm, class, interface, file: Tiếng Anh.
- Thông điệp lỗi/phản hồi giữa BE ↔ FE: mã KEY `UPPER_SNAKE_CASE`, FE dịch qua `apps/web/messages/<locale>/errors.json`.

# 9. Phân cấp Rule (Rule Hierarchy)
- [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md) là nguồn quy chuẩn chi tiết của toàn bộ dự án.
- Đây là file tóm tắt chung của Monorepo.
- Khi làm việc trong `apps/api`, `apps/web`, `packages/db`, `packages/shared`, bắt buộc đọc thêm `AGENTS.md` nằm trong thư mục đó.
