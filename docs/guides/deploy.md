# Triển khai (Deploy)

Giai đoạn chạy thử, chi phí gần như 0đ. Mọi dịch vụ đặt ở **Singapore**.

```text
Trình duyệt ─► Vercel (apps/web) ── rewrites /api ─► Render (apps/api)
                   │                                     │
                   └── Prisma (admin) ─► Neon ◄──────────┘
                                         Upstash Redis ◄── API
```

Trình duyệt chỉ thấy domain Vercel → cookie dùng chung, không cần CORS.

## 1. Dịch vụ đang dùng

| Dịch vụ | Vai trò | Gói | Địa chỉ |
| :--- | :--- | :--- | :--- |
| Vercel | Web (Next.js) | Hobby | https://traditional-ao-dai.vercel.app |
| Render | API (Express) | Free | https://aodai.onrender.com |
| Neon | PostgreSQL | Free (1 GB) | Project `AoDai`, branch `production` |
| Upstash | Redis | Free | Database `aodai` |
| Cloudinary | Ảnh | Free | — |
| Google Cloud | OAuth đăng nhập Google | Free | — |

⚠️ **Giới hạn gói free:** Render ngủ sau 15 phút (request đầu chậm ~50s) · Neon tạm nghỉ khi rảnh · Vercel Hobby **chỉ cho phi thương mại** — bán thật phải lên Pro.

## 2. Render (API)

| Mục | Giá trị |
| :--- | :--- |
| Branch | `main` |
| Root Directory | _(để trống)_ |
| Build Command | `corepack pnpm install --frozen-lockfile && corepack pnpm --filter @repo/db generate` |
| Start Command | `corepack pnpm --filter @repo/api start` |

**Environment:**

| Biến | Giá trị |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `24` |
| `COREPACK_ENABLE_DOWNLOAD_PROMPT` | `0` |
| `DATABASE_URL` | Neon **direct** (không `-pooler`) |
| `REDIS_URL` | Upstash `rediss://...` |
| `FRONTEND_URL` | `https://traditional-ao-dai.vercel.app` |
| `TRUST_PROXY` | `2` |
| `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` | cặp khóa RS256 |
| `GOOGLE_CLIENT_ID` | OAuth Client ID |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | từ Cloudinary |
| `BREVO_API_KEY` | Brevo → SMTP & API → **API keys** (`xkeysib-...`). Gửi qua HTTPS — Render free chặn cổng SMTP |
| `SMTP_FROM` | email sender đã xác minh trên Brevo |
| `MAIL_FROM_NAME` | tên hiển thị (mặc định `Áo Dài Truyền Thống`) |

Không đặt cả `BREVO_API_KEY` lẫn `SMTP_*` → email chỉ in ra Logs của Render (dev).

Không đặt `PORT` (Render tự cấp) và `REDIS_HOST/PORT/PASSWORD` (đã có `REDIS_URL`).

## 3. Vercel (Web)

| Mục | Giá trị |
| :--- | :--- |
| Root Directory | `apps/web` |
| Include files outside root directory | Bật |
| Function Region | Singapore (`sin1`) |

**Environment** (Production + Preview):

| Biến | Giá trị |
| :--- | :--- |
| `API_INTERNAL_URL` | `https://aodai.onrender.com` (không `/` cuối) |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | giống `GOOGLE_CLIENT_ID` |
| `JWT_PUBLIC_KEY` | giống bên API — **không** đặt private key |
| `DATABASE_URL` | Neon **pooled** (`-pooler`) + `&pgbouncer=true&connection_limit=1` |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` |

Đổi env xong phải **Redeploy** — `API_INTERNAL_URL` và `NEXT_PUBLIC_*` được đọc lúc build.

## 4. Google OAuth

Credentials → OAuth Client → **Authorized JavaScript origins**: `http://localhost:3000` và `https://traditional-ao-dai.vercel.app`. Bản Preview (link ngẫu nhiên) không đăng nhập Google được.

## 5. Database

Migration và seed chạy **từ máy local** (Pre-Deploy Command của Render là tính năng trả phí). PowerShell, ở thư mục gốc:

```powershell
$env:DATABASE_URL="<Neon direct>"
```

```powershell
pnpm db:deploy
```

Seed (chỉ lần đầu) — luôn đặt mật khẩu admin riêng trước:

```powershell
$env:SEED_ADMIN_PASSWORD="<mật khẩu mạnh>"
```

```powershell
pnpm db:seed
```

Biến `$env:` chỉ sống trong cửa sổ đó, không ảnh hưởng `.env` local.

## 6. Quy trình cập nhật

1. Sửa schema → `pnpm db:migrate --name <ten>` ở local (**không dùng `db push`**).
2. Push lên `main` → Render và Vercel tự deploy.
3. Có migration mới → chạy `pnpm db:deploy` lên Neon (mục 5).
4. Kiểm tra `https://traditional-ao-dai.vercel.app/api/health` → `database: ok, redis: ok`.

