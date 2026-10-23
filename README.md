# 🌸 Traditional Ao Dai

Webshop bán Áo Dài truyền thống Việt Nam, có dịch vụ **may đo theo số đo**. Gồm Storefront (khách hàng) và khu Quản trị (nhân viên, admin).

> 📐 Quy chuẩn code, kiến trúc, bảo mật: [`AGENTS.md`](AGENTS.md) — đọc trước khi viết code. File này chỉ hướng dẫn cài đặt, chạy và triển khai.

---

## 1. Tổng quan

| Workspace | Vai trò | Công nghệ chính |
| :--- | :--- | :--- |
| `apps/web` | Storefront + Admin | Next.js 16, React 19, Tailwind v4, React Query, Zustand, next-intl (vi/en) |
| `apps/api` | REST API | Express 4, JWT RS256, Zod v4, ioredis, Cloudinary, Nodemailer/Brevo, Swagger |
| `packages/db` | Database | Prisma 5 + PostgreSQL (schema, migration, seed) |
| `packages/shared` | Hợp đồng FE ↔ BE | Kiểu DTO/response, hằng số, cookie, tiền tệ, validator Zod |
| `packages/config` | Cấu hình công cụ | ESLint, tsconfig, Prettier dùng chung |

```text
Trình duyệt ── /vi/...  ─► apps/web (Next.js)
            ── /api/... ─► apps/web rewrites ─► apps/api (Express) ─► PostgreSQL
                                                      └─► Redis (OTP, rate-limit)
Admin (Server Actions) ─────────── Prisma trực tiếp ─► PostgreSQL
```

## 2. Cài đặt

**Yêu cầu:** Node.js ≥ 22.18 (khuyến nghị 24) · pnpm 11 (chỉ pnpm, không npm/yarn) · Docker (Redis) · PostgreSQL.

```bash
git clone <url-repo> && cd learn-ecommerce-shop
pnpm install
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

| File | Biến cần điền — mỗi biến có ghi chú `[BẮT BUỘC]` / `[TÙY CHỌN]` và cách lấy trong `.env.example` |
| :--- | :--- |
| `apps/api/.env.local` | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `GOOGLE_CLIENT_ID`, `CLOUDINARY_*` · email (`BREVO_API_KEY` / `SMTP_*`) bỏ trống khi dev → mã in ra console |
| `apps/web/.env.local` | `DATABASE_URL` và `JWT_PUBLIC_KEY` **giống hệt** bên API · `NEXT_PUBLIC_GOOGLE_CLIENT_ID` · giữ `NEXT_PUBLIC_API_URL=/api` |

API và lệnh `pnpm db:*` nạp `.env.local` trước rồi tới `.env` (file trước được ưu tiên); Next.js tự nạp `.env.local`. Production không dùng file — đặt biến trên Render / Vercel ([`RUNBOOK.md`](RUNBOOK.md) §3).

**Tạo cặp khóa JWT RS256** (dán chuỗi Base64 vào `.env.local`; web **chỉ** nhận public key):

```bash
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in private.pem -pubout -out public.pem
base64 -w 0 private.pem   # -> JWT_PRIVATE_KEY (chỉ apps/api)
base64 -w 0 public.pem    # -> JWT_PUBLIC_KEY (cả api và web)
```

## 3. Chạy dự án

```bash
docker compose up -d   # 1. Redis
pnpm db:deploy         # 2. Áp migration
pnpm db:seed           # 3. Tài khoản + dữ liệu demo
pnpm dev               # 4. API + Web song song
```

| Địa chỉ | Mô tả |
| :--- | :--- |
| http://localhost:3000 | Storefront (tự chuyển `/vi` hoặc `/en`) |
| http://localhost:3000/vi/admin/login | Khu quản trị |
| http://localhost:3001/api/health | Health check (DB + Redis) |
| http://localhost:3001/api-docs | Swagger (chỉ ngoài production) |

**Tài khoản do seed tạo** (một tài khoản dùng được cả storefront lẫn khu quản trị nếu là STAFF/ADMIN):

| Email | Vai trò | Mật khẩu mặc định |
| :--- | :--- | :--- |
| `admin@gmail.com` | ADMIN | `admin123` — đổi qua `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_PHONE` |
| `staff@aodai.local` | STAFF (`MANAGE_ORDERS`, `UPDATE_TAILORING`) | `Demo@123` — đổi qua `SEED_DEMO_PASSWORD` |
| `customer@aodai.local` | CUSTOMER (có hồ sơ số đo, đơn `AD-SEED-0001`) | `Demo@123` |

## 4. Lệnh thường dùng

| Lệnh | Tác dụng |
| :--- | :--- |
| `pnpm dev` | Chạy dev mọi workspace |
| `pnpm check` | Typecheck + lint toàn repo (gồm cả seed) — **bắt buộc xanh trước khi commit** |
| `pnpm build` | Build mọi workspace |
| `pnpm db:migrate --name <ten>` | Tạo + áp migration (dev) |
| `pnpm db:deploy` | Áp migration có sẵn vào DB local / CI |
| `pnpm db:status:prod` / `db:deploy:prod` / `db:seed:prod` | Xem / áp migration / seed lên **Neon production** (đọc `apps/api/.env.production`) |
| `pnpm db:generate` | Sinh Prisma Client (Windows: dừng `pnpm dev` trước, nếu không lỗi `EPERM`) |
| `pnpm db:seed` / `pnpm db:studio` | Seed dữ liệu / mở Prisma Studio (http://localhost:5555) |
| `pnpm --filter @repo/<workspace> add <pkg>` | Cài package cho một workspace |
| `pnpm format` | Prettier (chưa bắt buộc — xem AGENTS.md §12) |

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): `install → db:generate → typecheck → lint` cho mọi PR và push lên `main` / `develop`.

## 5. Triển khai

Giai đoạn chạy thử, chi phí gần như 0đ, mọi dịch vụ đặt ở **Singapore**. Trình duyệt chỉ thấy domain Vercel → cookie dùng chung, không cần CORS.

| Dịch vụ | Vai trò | Địa chỉ / ghi chú |
| :--- | :--- | :--- |
| Vercel (Hobby) | Web | https://traditional-ao-dai.vercel.app — Hobby **chỉ cho phi thương mại** |
| Render (Free) | API | https://aodai.onrender.com — ngủ sau 15 phút, request đầu ~50s |
| Neon (Free) | PostgreSQL | Project `AoDai`, branch `production` |
| Upstash (Free) | Redis | Database `aodai` |
| Cloudinary · Google Cloud · Brevo | Ảnh · OAuth · Email | — |

**Render (API)** — Branch `main`, Root Directory trống.
- Build: `corepack pnpm install --frozen-lockfile && corepack pnpm --filter @repo/db generate`
- Start: `corepack pnpm --filter @repo/api start` (chạy `tsx src/server.ts`; `build` của API chỉ type-check)
- Env: `NODE_ENV=production`, `NODE_VERSION=24`, `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`, `DATABASE_URL` (Neon **direct**, không `-pooler`), `REDIS_URL` (`rediss://...`), `FRONTEND_URL`, `TRUST_PROXY=2`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `GOOGLE_CLIENT_ID`, `CLOUDINARY_*`, `BREVO_API_KEY` (Render free chặn cổng SMTP), `SMTP_FROM`, `MAIL_FROM_NAME`. Không đặt `PORT` và `REDIS_HOST/PORT/PASSWORD`.

**Vercel (Web)** — Root Directory `apps/web`, bật *Include files outside root directory*, region `sin1`.
- Env (Production + Preview): `API_INTERNAL_URL=https://aodai.onrender.com` (không `/` cuối), `NEXT_PUBLIC_API_URL=/api`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `JWT_PUBLIC_KEY` (**không** private key), `DATABASE_URL` (Neon **pooled** + `&pgbouncer=true&connection_limit=1`), `ENABLE_EXPERIMENTAL_COREPACK=1`.
- Đổi env phải **Redeploy** (`API_INTERNAL_URL`, `NEXT_PUBLIC_*` đọc lúc build).

**Google OAuth** — Authorized JavaScript origins: `http://localhost:3000` và domain Vercel (bản Preview không đăng nhập Google được).

**Database production** — chạy từ máy local bằng lệnh `:prod`, đọc **duy nhất** `apps/api/.env.production` (gitignored; điền `DATABASE_URL` = Neon **direct**, `SEED_ADMIN_PASSWORD`). Thiếu file thì lệnh dừng, không bao giờ rơi về DB local:

```bash
pnpm db:status:prod    # migration nào chưa áp lên Neon
pnpm db:deploy:prod    # áp migration lên Neon
pnpm db:seed:prod      # seed lần đầu — tự tắt dữ liệu demo, bắt buộc SEED_ADMIN_PASSWORD
```

**Quy trình cập nhật:** sửa schema → `pnpm db:migrate --name <ten>` ở local → push `main` (Render + Vercel tự deploy) → có migration mới thì `pnpm db:deploy:prod` → kiểm tra `/api/health` trả `database: ok, redis: ok`.

👉 Từng tình huống thay đổi (schema, env, package, domain, khóa bí mật, rollback...) và các bước ở Neon / Render / Vercel: [`RUNBOOK.md`](RUNBOOK.md).

## 6. Quy ước Git

Nhánh `main` (production), `develop` (tích hợp), `feat/…`, `fix/…`. Commit tiếng Việt có tiền tố `feat:` `fix:` `refactor:` `docs:` `chore:` `test:`. Chỉ `git add` đúng file; không push thẳng `main`; không commit `.env` / `.env.local`. Chi tiết: [`AGENTS.md`](AGENTS.md) §11.
