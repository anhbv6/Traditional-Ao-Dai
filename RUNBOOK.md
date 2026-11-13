# 🛠️ Runbook — Sổ Tay Vận Hành & Kỹ Thuật

Tài liệu hướng dẫn chi tiết quy trình thiết lập, phát triển hằng ngày, quản trị cơ sở dữ liệu và vận hành hệ thống **Thiên Canh**.

---

## #1 Công nghệ & Hạ tầng triển khai hiện tại

Hệ thống được thiết kế theo kiến trúc tối ưu chi phí (Zero-cost hobby tier), toàn bộ dịch vụ đặt tại khu vực **Singapore (`sin1` / `ap-southeast-1`)** để đảm bảo độ trễ thấp nhất về Việt Nam:

| Dịch vụ | Phân hệ đảm nhiệm | Cơ chế & Lưu ý kết nối |
| :--- | :--- | :--- |
| **Vercel** (Hobby) | Storefront + Admin Web (`apps/web`) | Next.js 16 App Router. Gọi DB qua chuỗi **Neon Pooled** (`&pgbouncer=true&connection_limit=1`) để chống tràn connection của Serverless Functions. |
| **Render** (Free Web Service) | Backend REST API (`apps/api`) | Express 4 chạy qua `tsx src/server.ts`. Kết nối DB qua chuỗi **Neon Direct** (cổng 5432, không `-pooler`). *Lưu ý: Free instance sẽ ngủ sau 15 phút nhàn rỗi (request đầu tiên mất ~50s).* |
| **Neon** (Serverless PostgreSQL) | Database chính (`packages/db`) | Project `AoDai`, branch `production`. Hỗ trợ Database Branching và Point-in-time restore (PITR). |
| **Upstash** (Serverless Redis) | Rate Limiting, OTP Cache, Session Grace | Kết nối bảo mật TLS qua `rediss://...`. Giới hạn cooldown 60s và hạn mức 10 OTP/ngày. |
| **Cloudinary** | CDN Lưu trữ hình ảnh & video | Tối ưu ảnh sản phẩm, ảnh chụp vải và tư liệu tiến độ thợ may tại xưởng. |
| **Brevo / SMTP** | Transactional Email | Gửi mã xác nhận tài khoản, mã khôi phục mật khẩu. |
| **Google Cloud Identity** | Đăng nhập một chạm Google | OAuth 2.0 Client ID (Authorized JavaScript origins: `http://localhost:3000` và domain Vercel). |

```text
Trình duyệt ── /vi/...  ─────────► Vercel (apps/web - Next.js 16)
            ── /api/... ─────────► Next.js rewrites ──► Render (apps/api - Express 4) ──► Neon (Direct)
                                                               └─► Upstash Redis (TLS)
Admin (Server Actions / Queries) ─── Prisma Client trực tiếp ────────────────────────────► Neon (Pooled)
```

---

## #2 Cài đặt dự án

### Yêu cầu tiên quyết
* **Node.js:** Phiên bản `>= 22.18` (khuyến nghị Node 24).
* **Package Manager:** Bắt buộc dùng **`pnpm 11`** (đã ghim trong `packageManager` của `package.json`). Tuyệt đối **KHÔNG** dùng `npm` hoặc `yarn`.
* **Cơ sở dữ liệu cục bộ:** PostgreSQL (cài trên máy hoặc qua Docker) và Redis (Docker).

### Các bước cài đặt
1. **Clone mã nguồn & Cài đặt dependencies:**
   ```bash
   git clone https://github.com/anhbv6/Traditional-Ao-Dai.git
   cd learn-ecommerce-shop
   pnpm install
   ```

2. **Thiết lập biến môi trường:**
   Tạo các file `.env.local` từ file mẫu `.env.example`:
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   cp apps/web/.env.example apps/web/.env.local
   ```
   * Điền `DATABASE_URL` cho DB local trong cả 2 file `.env.local`.
   * Web giữ nguyên `NEXT_PUBLIC_API_URL=/api` (để dùng chung cookie qua rewrite).

3. **Tạo cặp khóa bí mật JWT RS256 (bất đối xứng):**
   ```bash
   openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
   openssl rsa -in private.pem -pubout -out public.pem
   base64 -w 0 private.pem   # Copy chuỗi này vào JWT_PRIVATE_KEY (chỉ apps/api/.env.local)
   base64 -w 0 public.pem    # Copy chuỗi này vào JWT_PUBLIC_KEY (cả api và web .env.local)
   rm private.pem public.pem # Xóa file pem tạm
   ```

---

## #3 Chạy dự án

```bash
docker compose up -d   # 1. Khởi động Redis cục bộ
pnpm db:deploy         # 2. Áp dụng các migration Prisma có sẵn
pnpm db:seed           # 3. Nạp dữ liệu tài khoản và sản phẩm mẫu
pnpm dev               # 4. Chạy song song cả Web và API
```

### Các đường dẫn kiểm tra cục bộ:
* **Storefront (Khách hàng):** [http://localhost:3000](http://localhost:3000) (tự chuyển `/vi` hoặc `/en`)
* **Khu quản trị (Admin):** [http://localhost:3000/vi/admin/login](http://localhost:3000/vi/admin/login)
* **API Health Check:** [http://localhost:3001/api/health](http://localhost:3001/api/health) (kiểm tra `database: ok`, `redis: ok`)
* **Swagger API Docs:** [http://localhost:3001/api-docs](http://localhost:3001/api-docs) (tài liệu tương tác API)

### Tài khoản tạo sẵn từ Seed:
| Email | Vai trò | Quyền hạn | Mật khẩu mặc định |
| :--- | :--- | :--- | :--- |
| `admin@gmail.com` | **ADMIN** | Toàn quyền hệ thống | `admin123` *(tùy chỉnh qua `SEED_ADMIN_PASSWORD`)* |
| `staff@aodai.local` | **STAFF** | `MANAGE_ORDERS`, `UPDATE_TAILORING` | `Demo@123` |
| `customer@aodai.local` | **CUSTOMER** | Mua hàng, có sẵn hồ sơ số đo & đơn mẫu | `Demo@123` |

> 💡 *Mẹo: Bạn có thể chạy riêng từng workspace trong các tab terminal khác nhau để dễ theo dõi log:*
> * `pnpm --filter @repo/web dev` (chuyên xem log Web/Next.js)
> * `pnpm --filter @repo/api dev` (chuyên xem log Express API)

---

## #4 Thao tác code hằng ngày

### 1. Luồng phân nhánh Git
* **`main`:** Nhánh Production (khi merge vào đây, Vercel và Render sẽ tự động build và deploy).
* **`develop`:** Nhánh tích hợp chính trong quá trình phát triển.
* **`feat/<tên>` / `fix/<tên>`:** Nhánh tính năng hoặc sửa lỗi tách ra từ `develop`.

### 2. Quy chuẩn kiểm tra bắt buộc trước khi Commit
Trước khi commit bất kỳ thay đổi nào, **BẮT BUỘC** phải chạy lệnh:
```bash
pnpm check
```
Lệnh này chạy song song `typecheck` và `lint` qua toàn bộ 6 workspace. Chỉ commit khi kết quả đạt **0 lỗi, 0 cảnh báo**.

### 3. Quy chuẩn Commit Message
Commit bằng **Tiếng Việt**, có tiền tố theo chuẩn Conventional Commits:
* `feat:` Tính năng mới (ví dụ: `feat: hoàn thiện giao diện may đo theo số đo`)
* `fix:` Sửa lỗi (ví dụ: `fix: sửa lỗi tính phụ phí bigsize trong giỏ hàng`)
* `refactor:` Tái cấu trúc mã nguồn không đổi chức năng
* `docs:` Cập nhật tài liệu
* `chore:` Công việc bảo trì, cấu hình build/tooling

---

## #5 Thao tác với thư viện & Dự án (Monorepo)

Monorepo bao gồm các workspace:
* `apps/web`: Next.js Storefront & Admin
* `apps/api`: Express REST API
* `packages/db`: Prisma Schema, Migrations, Seed
* `packages/shared`: Hợp đồng FE ↔ BE, DTO, Sizing, Validation
* `packages/config`: ESLint, tsconfig, Prettier

### Thêm / Xóa thư viện
* **Thêm thư viện cho một workspace cụ thể:**
  ```bash
  pnpm --filter @repo/<workspace> add <tên_gói>
  # Ví dụ: pnpm --filter @repo/web add date-fns
  # Dành cho devDependency: pnpm --filter @repo/api add -D @types/multer
  ```
* **Bắt buộc commit lockfile:** Sau khi thêm gói, luôn commit cả `package.json` và `pnpm-lock.yaml`. Render và Vercel cài đặt với cờ `--frozen-lockfile`, nếu thiếu lockfile bản build sẽ thất bại ngay.
* **Build toàn bộ dự án:**
  ```bash
  pnpm build
  ```

---

## #6 Thao tác Backend & Cơ sở dữ liệu

### 1. Sửa đổi Schema CSDL ở môi trường Local
Khi cần chỉnh sửa bảng/cột trong [`packages/db/prisma/schema.prisma`](packages/db/prisma/schema.prisma):
```bash
# 1. Dừng terminal dev (trên Windows để tránh lỗi EPERM khi ghi đè file Client)
# 2. Tạo và áp migration mới vào DB local:
pnpm db:migrate --name <tên_ngắn_gọn>

# 3. Sinh lại Prisma Client:
pnpm db:generate

# 4. Kiểm tra typecheck toàn dự án:
pnpm check
```

### 2. Thao tác với CSDL Production (Neon)
Lệnh tác động lên CSDL Production chạy an toàn từ máy local bằng hậu tố `:prod`, đọc chuỗi kết nối duy nhất từ file `apps/api/.env.production` (file này được gitignore):

```bash
# Xem danh sách các migration nào trong code chưa được áp dụng lên Neon:
pnpm db:status:prod

# Áp dụng toàn bộ migration còn thiếu lên Neon:
pnpm db:deploy:prod
```

### 3. Mở giao diện trực quan Prisma Studio
```bash
pnpm db:studio   # Mở http://localhost:5555 để xem và sửa dữ liệu trực tiếp
```

---

## #7 Quản lý Seed dữ liệu (Seed Data)

Thư mục chứa script seed: `packages/db/prisma/seed/` (`accounts.ts`, `catalog.ts`, `operations.ts`).

### 1. Nạp dữ liệu ở môi trường Local / Dev
```bash
pnpm db:seed
```
* Tạo Super Admin (`admin@gmail.com`), tài khoản nhân viên Staff, tài khoản khách hàng mẫu.
* Tạo danh mục 5 nhóm gốc, bảng size chuẩn, các sản phẩm áo dài mẫu và đơn hàng thử nghiệm.

### 2. Nạp dữ liệu khởi tạo trên Neon Production
```bash
pnpm db:seed:prod
```
* **Chỉ chạy lần đầu tiên** khi khởi tạo hệ thống mới.
* Tự động đặt `SEED_DEMO_DATA=false`: **Không nạp dữ liệu rác demo**, chỉ tạo tài khoản Super Admin từ `SEED_ADMIN_PASSWORD` và 5 nhóm danh mục gốc cố định (Áo dài, Quần, Phụ kiện, Giày guốc, Vải) theo chuẩn song ngữ.

### 3. Nguyên tắc an toàn của Seed
* **Idempotent:** Script seed dùng cơ chế `upsert` theo khóa định danh, có thể chạy lại nhiều lần mà không bị lỗi trùng lặp dữ liệu.
* **Bảo vệ mật khẩu:** Không bao giờ ghi đè mật khẩu của tài khoản đã tồn tại trong CSDL.
