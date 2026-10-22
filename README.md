# 🌸 Traditional Ao Dai

Webshop bán Áo Dài truyền thống Việt Nam, có dịch vụ **may đo theo số đo**. Gồm Storefront (khách hàng) và khu Admin (quản trị).

> 📐 Quy chuẩn code: [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md) — đọc trước khi đóng góp.

---

## 1. Tổng quan

| Workspace | Vai trò | Công nghệ chính |
| :--- | :--- | :--- |
| [`apps/web`](apps/web/README.md) | Storefront + Admin | Next.js 16, React 19, Tailwind v4, React Query, Zustand, next-intl |
| [`apps/api`](apps/api/README.md) | REST API | Express 4, JWT RS256, Zod, ioredis, Cloudinary, Nodemailer, Swagger |
| [`packages/db`](packages/db/README.md) | Database | Prisma 5 + PostgreSQL |
| [`packages/shared`](packages/shared/README.md) | Hợp đồng FE ↔ BE | Kiểu response, cookie, tiền tệ, locale, validator Zod |
| [`packages/config`](packages/config/README.md) | Cấu hình công cụ | ESLint, tsconfig, Prettier dùng chung |

## 2. Luồng hệ thống

```text
Trình duyệt ── /vi/...  ─► apps/web (Next.js)
            ── /api/... ─► apps/web rewrites ─► apps/api (Express) ─► PostgreSQL
                                                      └─► Redis (OTP, rate-limit)
Admin (Server Actions) ─────────── Prisma trực tiếp ─► PostgreSQL
```

- **Cùng origin:** trình duyệt chỉ gọi `/api/*` trên domain web → cookie httpOnly dùng chung, không cần CORS.
- **Storefront** lấy dữ liệu qua Express API. **Admin** gọi Prisma trực tiếp (không có `/api/admin/*`).
- **Auth:** khách = access token trong bộ nhớ + refresh cookie; admin = cookie `admin_token`. Phiên lưu ở bảng `UserSession`.

---

## 3. Yêu cầu

- **Node.js ≥ 22.18** (khuyến nghị 24)
- **pnpm 11** — `npm install -g pnpm` (chỉ dùng pnpm, không dùng npm/yarn)
- **Docker** (chạy Redis)
- **PostgreSQL** (local hoặc cloud)

## 4. Cài đặt

```bash
git clone <url-repo> && cd learn-ecommerce-shop
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Điền biến môi trường (ý nghĩa từng biến có comment trong `.env.example`):

| File | Biến cần điền |
| :--- | :--- |
| `apps/api/.env` | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `REDIS_*`, `GOOGLE_CLIENT_ID`, `CLOUDINARY_*` · `SMTP_*` bỏ trống khi dev (email in ra console) |
| `apps/web/.env` | `DATABASE_URL` và `JWT_PUBLIC_KEY` **giống hệt** bên API · `NEXT_PUBLIC_GOOGLE_CLIENT_ID` · giữ nguyên `NEXT_PUBLIC_API_URL="/api"` |

🔑 Tạo khóa JWT: xem [`docs/guides/jwt-keys.md`](docs/guides/jwt-keys.md). Web **chỉ** nhận public key.

## 5. Chạy dự án (theo thứ tự)

```bash
docker compose up -d   # 1. Redis
pnpm db:deploy         # 2. Áp migration
pnpm db:seed           # 3. Dữ liệu mẫu + tài khoản admin
pnpm dev               # 4. Chạy API + Web song song
```

| Địa chỉ | Mô tả |
| :--- | :--- |
| http://localhost:3000 | Storefront (tự chuyển về `/vi` hoặc `/en`) |
| http://localhost:3000/vi/admin/login | Admin — mặc định `admin@gmail.com` / `admin123` |
| http://localhost:3001/api/health | Health check API (kèm DB + Redis) |
| http://localhost:3001/api-docs | Swagger (chỉ ngoài production) |

## 6. Lệnh thường dùng

| Lệnh | Tác dụng |
| :--- | :--- |
| `pnpm dev` | Chạy dev mọi workspace |
| `pnpm check` | Typecheck + lint toàn repo — **bắt buộc xanh trước khi commit** |
| `pnpm build` | Build mọi workspace |
| `pnpm format` | Prettier (chưa bắt buộc) |
| `pnpm db:generate` | Sinh Prisma Client |
| `pnpm db:migrate --name <ten>` | Tạo migration mới (dev) |
| `pnpm db:deploy` | Áp migration có sẵn (prod/CI) |
| `pnpm db:seed` / `pnpm db:studio` | Seed dữ liệu / mở Prisma Studio |
| `pnpm --filter @repo/web add <pkg>` | Cài package cho một workspace |

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) chạy `typecheck` + `lint` cho mọi PR và push lên `main`/`develop`.

---

## 7. Triển khai

Đang chạy thử: **Web** https://traditional-ao-dai.vercel.app (Vercel) · **API** https://aodai.onrender.com (Render) · Neon (Postgres) · Upstash (Redis).

👉 Cấu hình đầy đủ, env từng nền tảng, quy trình cập nhật và lỗi đã gặp: [`docs/guides/deploy.md`](docs/guides/deploy.md).

Nguyên tắc chung:
- Web và API **cùng origin**: web chuyển tiếp `/api` sang API qua `API_INTERNAL_URL`.
- `NODE_ENV=production` → cookie `Secure` (bắt buộc HTTPS), Swagger tự tắt.
- Migration production: `pnpm db:deploy` (không chạy `db:migrate`, không dùng `db push`).
- API production chạy `tsx src/server.ts` (`build` của API chỉ type-check).
- `TRUST_PROXY` = số proxy đứng trước API — rate-limit theo IP phụ thuộc vào đây.

## 8. Tài liệu khác

- [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md) — quy chuẩn đầy đủ (kiến trúc, đặt tên, i18n, git).
- [`docs/guides/deploy.md`](docs/guides/deploy.md) — triển khai Vercel + Render + Neon + Upstash.
- [`docs/guides/admin-ui.md`](docs/guides/admin-ui.md) — giao diện khu admin.
- `AGENTS.md` ở gốc và từng workspace — tóm tắt quy tắc cho người và AI.
- `.claude/skills/` — quy trình tạo module API, màn admin, feature storefront, mã KEY.

## 9. Quy ước Git

- Commit tiếng Việt, tiền tố `feat:` `fix:` `refactor:` `docs:` `chore:` `test:`.
- Chỉ `git add` đúng file đã sửa; không push thẳng `main`/`master`; không commit `.env`.
