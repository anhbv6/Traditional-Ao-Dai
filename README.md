# 🌸 Traditional Ao Dai - Vietnamese Traditional Ao Dai E-commerce Webshop

Nền tảng thương mại điện tử chuyên nghiệp cung cấp Áo dài truyền thống, cách tân, áo dài cưới và dịch vụ **đặt may theo số đo riêng (Custom Measurement)**. 

Dự án được xây dựng theo kiến trúc **PNPM Monorepo** phân tách rõ ràng giữa Frontend (Next.js), Backend (Express) và Database (Prisma).

---


> 📐 **Quy chuẩn dự án:** [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md) — đọc trước khi đóng góp code. Tóm tắt cho từng workspace nằm ở các file `AGENTS.md`.

## 🏗️ Cấu Trúc Monorepo & Thiết Kế Hệ Thống

Frontend áp dụng **Feature-based Architecture**, Backend thiết kế theo **Modular Monolith**, hợp đồng dữ liệu FE/BE dùng chung qua package `@repo/shared`.

### 🔀 Luồng hệ thống

```text
Trình duyệt ── /vi/...  ─► apps/web (Next.js) ── Server/Client Components
            ── /api/... ─► apps/web rewrites ───► apps/api (Express) ── Prisma ──► PostgreSQL
                                                         └─ ioredis ──► Redis (OTP, rate-limit)
Admin (Server Actions) ───────────────────────── Prisma (trực tiếp) ──► PostgreSQL
```

*   **Cùng origin:** trình duyệt chỉ gọi `/api/*` trên domain của web, Next.js chuyển tiếp sang Express → cookie phiên httpOnly dùng chung, không cần CORS.
*   **Storefront** lấy dữ liệu qua Express API. **Admin** dùng Server Components + Server Actions gọi Prisma trực tiếp, mỗi action đều kiểm tra phiên và quyền.

### 📁 Sơ đồ thư mục dự án

```text
learn-ecommerce-shop/
├── apps/
│   ├── web/                      # 💻 Storefront + Admin (Next.js 16, React 19)
│   │   ├── messages/{vi,en}/     # File dịch next-intl (errors.json = toàn bộ mã lỗi BE)
│   │   └── src/
│   │       ├── app/[locale]/     # Routing: (store), (auth), (admin)
│   │       ├── components/       # ui (shadcn), shared, common, providers
│   │       ├── features/         # Module nghiệp vụ: auth, cart, products, profile, admin/...
│   │       ├── hooks/            # Hook dùng chung
│   │       ├── i18n/             # Cấu hình next-intl
│   │       ├── lib/              # api-client, errorMessage, utils, jwt.server
│   │       └── proxy.ts          # Middleware Next 16: i18n + chặn route
│   └── api/                      # ⚙️ Backend API (Express) - Modular Monolith
│       └── src/
│           ├── index.ts          # Entrypoint: helmet, CORS, body limit, health check, graceful shutdown
│           ├── routes.ts         # Bộ định tuyến trung tâm
│           ├── modules/          # auth, otp, user, upload (routes/controller/service/schema/KEYS.md)
│           └── shared/           # config (env, swagger), middlewares, utils (rateLimit, verificationCode, authCookies...)
├── packages/
│   ├── db/                       # 🗄️ Prisma schema, migrations, seed, Prisma Client (@repo/db)
│   └── shared/                   # 🤝 Validator Zod, kiểu response, tên cookie, tiền tệ, locale (@repo/shared)
├── docs/PROJECT_RULES.md         # 📐 Quy chuẩn dự án
├── .github/workflows/ci.yml      # CI: typecheck + lint
├── docker-compose.yml            # Redis
└── pnpm-workspace.yaml
```

### 💻 Thiết kế Frontend (Feature-based Architecture)

*   **`features/<feature>/`** tự đóng gói `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`, `validations/` và chỉ public qua `index.ts`.
*   **`app/[locale]/`** là lớp routing/layout, chỉ lắp ráp feature.
*   **State:** React Query cho dữ liệu từ server, Zustand cho client state (phiên khách hàng, giỏ hàng). Phiên admin đọc từ server qua `useAdminSession()`.
*   **Khu vực Admin:** `features/admin/<module>/{queries,actions,components}` — Server Action luôn gọi `authorizeAdminAction()`, page luôn gọi `requireAdminPage()`.

### ⚙️ Thiết kế Backend (Modular Monolith)

*   **`modules/<module>/`**: `*.routes.ts` (endpoint + Swagger), `*.controller.ts` (mỏng), `*.service.ts` (nghiệp vụ + Prisma), `*.schema.ts` (Zod), `KEYS.md` (mã phản hồi).
*   **`shared/`**: `config/` (env Zod, Swagger), `middlewares/` (`authGuard`, `errorHandler`, `validate`, `requestLogger`), `utils/` (`rateLimit`, `verificationCode`, `authCookies`, `session`, `jwt`, `mail`...).
*   Response thống nhất `{ status, statusCode, message: "MA_KEY", data, meta }` — `message` luôn là mã KEY để FE dịch.

---

## 🛠️ Chi Tiết Công Nghệ & Thư Viện Sử Dụng

### 🖥️ Frontend Web (`apps/web`)

*   **Bộ Khung Cốt Lõi (Core Framework):**
    *   **Next.js (v16.2.10) (App Router):** Tận dụng Server Components (RSC) để tối ưu hóa SEO và hiệu năng hiển thị.
    *   **React (v19.2.4):** Phiên bản React mới nhất với nhiều cải tiến về Concurrent Features và hooks.
    *   **TypeScript (v5):** Đảm bảo an toàn kiểu dữ liệu, giảm thiểu lỗi runtime.
*   **Thiết Kế Giao Diện & CSS:**
    *   **Tailwind CSS (v4) & PostCSS:** Engine CSS utility-first biên dịch siêu nhanh và tối ưu hóa CSS bundle.
    *   **Tailwind Merge & Class Variance Authority (CVA):** Giúp ghép nối các class Tailwind thông minh và định nghĩa các biến thể component linh hoạt.
*   **Quản Lý Trạng Thái & Fetch Dữ Liệu:**
    *   **TanStack React Query (v5.101.4):** Quản lý Server State, cơ chế tự động caching, re-validation, và tối ưu hóa đồng bộ dữ liệu với Backend.
    *   **Zustand (v5.0.15):** Quản lý Client State toàn cục cực kỳ gọn nhẹ và hiệu năng cao.
*   **Xử Lý Form & Validate Dữ Liệu:**
    *   **React Hook Form (v7.85.0):** Tối ưu hóa hiệu năng nhập liệu của Form, giảm số lần re-render.
    *   **Zod (v4.4.3):** Schema validation mạnh mẽ ở cả client và server.
    *   **@hookform/resolvers:** Cầu nối liên kết schema Zod vào React Hook Form để trả lỗi trực quan.
*   **Hiệu Ứng & Animation:**
    *   **Motion (Framer Motion 12):** Thư viện chuẩn để phát triển chuyển động, chuyển trang và hover mượt mà.
    *   **Lenis Smooth Scroll:** Mang lại trải nghiệm cuộn trang mượt mà (smooth scrolling).
    *   **OGL (v1.0.11):** Thư viện WebGL siêu nhẹ để vẽ các hiệu ứng tương tác 3D/Canvas phức tạp.
    *   **DotLottie React & React UseAnimations:** Render các animation vector Lottie chất lượng cao và các biểu tượng tương tác chuyển động nhỏ (micro-animations).
*   **Các UI Component & Primitives:**
    *   **Base UI React (v1.6.0):** Các component thô không style (headless components) giúp tùy biến giao diện linh hoạt.
    *   **Vaul (v1.1.2):** Hỗ trợ làm Drawer kéo vuốt (Bottom Sheet) mượt mà trên mobile.
    *   **Embla Carousel (v8.6.0):** Slider kéo vuốt đa năng.
    *   **React Day Picker (v10.0.1):** Lịch chọn ngày phục vụ đặt lịch may đo hoặc hẹn giờ giao nhận.
    *   **React Rating:** Hệ thống hiển thị và bình chọn số sao sản phẩm.
    *   **Lucide React & React Icons:** Bộ sưu tập icon đa dạng, tối ưu SVG.
*   **Đa Ngôn Ngữ & Tiện Ích Khác:**
    *   **Next-intl (v4.13.2):** Hỗ trợ chuyển đổi ngôn ngữ (i18n) mượt mà dựa trên routing.
    *   **Date-fns (v4.4.0):** Xử lý định dạng ngày tháng hiển thị đơn hàng, đánh giá.
    *   **Toast (Base UI):** Hệ thống thông báo `showToast` dựng trên `@base-ui/react/toast` (`components/ui/toast.tsx`).
*   **Bảo Mật:**
    *   **@marsidev/react-turnstile:** Tích hợp Cloudflare Turnstile chống spam form đăng ký/đăng nhập.
    *   **@react-oauth/google:** Đăng nhập trực tiếp bằng tài khoản Google phía client.

### ⚙️ Backend API (`apps/api`)

*   **Bộ Khung API Server:**
    *   **Express.js (v4.22.2):** Framework phổ biến để xây dựng RESTful API Server.
    *   **TSX (v4.7.1) & TS-Node-Dev (v2.0.0):** Trình biên dịch chạy code TypeScript trực tiếp, hỗ trợ Hot-Reload cực nhanh khi phát triển.
    *   **TypeScript (v5.9.3):** Đảm bảo tính nhất quán của dữ liệu từ Database lên API.
*   **Xác Thực & Bảo Mật:**
    *   **JSONWebToken (JWT) (v9.0.3):** Xử lý mã hóa và giải mã Access Token & Refresh Token phục vụ đăng nhập bảo mật.
    *   **Bcryptjs (v3.0.3):** Mã hoá một chiều mật khẩu trước khi lưu trữ vào Database.
    *   **Google Auth Library (v11.0.2):** Thư viện chính thức xác thực OAuth2 token từ Google trên server.
*   **Giao Tiếp Dịch Vụ & Database:**
    *   **IoRedis (v6.0.0):** Kết nối Redis để lưu OTP, mã xác minh email, reset token và bộ đếm rate-limit.
    *   **Nodemailer (v9.0.5):** Gửi email chứa mã xác thực OTP hoặc hóa đơn mua hàng.
    *   **Cors (v2.8.6):** Middleware kiểm soát chính sách chia sẻ tài nguyên nguồn gốc chéo an toàn.
    *   **Helmet (v8):** Thiết lập các HTTP security header.
*   **Xác Thực Đầu Vào & Tài Liệu:**
    *   **Zod (v4.4.3):** Middleware kiểm tra kiểu dữ liệu đầu vào của các API request.
    *   **Swagger JSDoc & Swagger UI Express:** Tự động biên dịch comment JSDoc thành file đặc tả OpenAPI và hiển thị thành giao diện Web UI chuyên nghiệp tại route `/api-docs`.

### 🗄️ Database Layer (`packages/db`)

*   **Prisma ORM (v5.12.0):** Bộ công cụ ORM thế hệ mới giúp thao tác dữ liệu qua các hàm TypeScript cực kỳ an toàn mà không cần viết SQL thuần.
*   **PostgreSQL:** Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ lưu giữ mọi thông tin nghiệp vụ.
*   **Dotenv-cli:** Giúp nạp động file môi trường phục vụ cho các câu lệnh migrate và generate của Prisma.

### 🤝 Shared Contracts (`packages/shared`)

*   Validator Zod (SĐT, email, mật khẩu, mã OTP), kiểu response API, tên cookie phiên, `formatVnd` / `toVnd`, `pickLocalized` — dùng chung cho cả Backend và Frontend để hai phía luôn khớp nhau.

---

## 📦 Hướng Dẫn Cài Đặt Chung Chi Tiết

Vui lòng chuẩn bị sẵn các môi trường sau trước khi cài đặt:
- **Node.js** phiên bản **22.18 trở lên** (khuyến nghị 24) — các package workspace được Node chạy thẳng từ mã TypeScript.
- **PNPM** cài đặt toàn cục: `npm install -g pnpm` (đây là lệnh npm duy nhất được dùng; mọi thao tác trong dự án đều dùng pnpm).
- **Docker Desktop** (dành cho chạy Redis).
- Một cơ sở dữ liệu **PostgreSQL** (chạy local hoặc cloud).

### Các bước cài đặt:

1. **Tải mã nguồn về máy cục bộ:**
   ```bash
   git clone <url-kho-chua-cua-ban>
   cd learn-ecommerce-shop
   ```

2. **Cài đặt toàn bộ dependencies trong monorepo:**
   ```bash
   pnpm install
   ```

3. **Tạo cặp khóa JWT RS256** theo hướng dẫn trong [`apps/api/configJWT.md`](apps/api/configJWT.md).

4. **Cấu hình biến môi trường cho Backend** — sao chép rồi điền giá trị:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   Các biến bắt buộc: `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `REDIS_*`, `GOOGLE_CLIENT_ID`, `CLOUDINARY_*`. `SMTP_*` có thể bỏ trống khi dev (email sẽ được in ra console). Ý nghĩa từng biến được ghi chú ngay trong file `.env.example`.

5. **Cấu hình biến môi trường cho Frontend:**
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```
   *   `NEXT_PUBLIC_API_URL="/api"` — giữ nguyên (web gọi API cùng origin qua Next.js rewrites).
   *   `API_INTERNAL_URL="http://127.0.0.1:3001"` — địa chỉ Express mà Next.js chuyển tiếp tới.
   *   `JWT_PUBLIC_KEY` — **giống hệt** giá trị trong `apps/api/.env` (chỉ public key, dùng để xác minh phiên quản trị ở server).
   *   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Client ID Google OAuth.

---

## 🚀 Hướng Dẫn Khởi Chạy Từng Phần & Câu Lệnh Chi Tiết

**⚠️ QUAN TRỌNG:** Khởi chạy các dịch vụ theo đúng thứ tự 4 bước sau:

### Step 1: Khởi chạy Redis
```bash
docker compose up -d
```
*   Dừng: `docker compose down` · Xem log: `docker compose logs -f redis` · Xem dữ liệu: `docker exec -it shop-redis redis-cli`.

### Step 2: Khởi tạo cơ sở dữ liệu (PostgreSQL & Prisma)
```bash
pnpm db:generate   # Sinh Prisma Client
pnpm db:deploy     # Áp dụng toàn bộ migration lên database
pnpm db:seed       # Tạo tài khoản admin + danh mục, sản phẩm mẫu
```
*   Tài khoản admin mặc định: **`admin@gmail.com` / `admin123`** (đổi qua biến `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
*   Khi sửa schema: `pnpm db:migrate --name <ten_thay_doi>` rồi `pnpm db:generate` (Windows: dừng dev server trước khi generate).

### Step 3: Khởi chạy Backend API
```bash
pnpm --filter @repo/api dev
```
*   API: [http://localhost:3001](http://localhost:3001) · Health check (kèm DB + Redis): [http://localhost:3001/api/health](http://localhost:3001/api/health)
*   Swagger UI: [http://localhost:3001/api-docs](http://localhost:3001/api-docs) (chỉ bật ngoài production).

### Step 4: Khởi chạy Frontend
```bash
pnpm --filter @repo/web dev
```
*   Storefront: [http://localhost:3000](http://localhost:3000) (tự điều hướng về `/vi` hoặc `/en`) · Admin: [http://localhost:3000/vi/admin/login](http://localhost:3000/vi/admin/login)
*   Mọi request `/api/*` từ trình duyệt đi qua cổng 3000.

---

## ⚡ Lệnh Chạy Nhanh & Kiểm Tra Chất Lượng

```bash
docker compose up -d   # Bật Redis
pnpm dev               # Chạy song song API + Web
pnpm check             # Type-check + lint toàn repo (bắt buộc xanh trước khi commit)
```

| Lệnh | Tác dụng |
| :--- | :--- |
| `pnpm typecheck` | `tsc --noEmit` cho mọi workspace |
| `pnpm lint` | ESLint |
| `pnpm build` | Build tất cả workspace |
| `pnpm db:studio` | Mở Prisma Studio |

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) tự chạy `typecheck` + `lint` cho mọi Pull Request.

---

## 🌐 Ghi Chú Triển Khai (Production)

*   Đặt **reverse proxy** (nginx / Cloudflare) trước Next.js, cấu hình `X-Forwarded-For` (ví dụ nginx: `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`) và đặt `TRUST_PROXY` trong `apps/api/.env` bằng số proxy đó. Rate-limit theo IP phụ thuộc vào cấu hình này.
*   Web và API phải chạy **cùng domain** (web chuyển tiếp `/api` sang API qua `API_INTERNAL_URL`); cookie được đặt `Secure` khi `NODE_ENV=production` nên bắt buộc HTTPS.
*   Áp dụng migration bằng `pnpm db:deploy` (không chạy `db:migrate` trên production).
*   Swagger UI tự tắt khi `NODE_ENV=production`.
