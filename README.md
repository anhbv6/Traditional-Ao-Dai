# 🌸 Traditional Ao Dai - Vietnamese Traditional Ao Dai E-commerce Webshop

Nền tảng thương mại điện tử chuyên nghiệp cung cấp Áo dài truyền thống, cách tân, áo dài cưới và dịch vụ **đặt may theo số đo riêng (Custom Measurement)**. 

Dự án được xây dựng theo kiến trúc **PNPM Monorepo** phân tách rõ ràng giữa Frontend (Next.js), Backend (Express) và Database (Prisma).

---

## 🏗️ Cấu Trúc Monorepo & Thiết Kế Hệ Thống

Dự án được cấu trúc dưới dạng monorepo để quản lý đồng thời cả Frontend, Backend và Database. Hệ thống áp dụng các mô hình kiến trúc hiện đại: Frontend sử dụng **Feature-based Architecture** và Backend thiết kế theo mô hình **Modular Monolith**.

### 📁 Sơ đồ thư mục dự án

```text
learn-ecommerce-shop/
├── apps/
│   ├── web/               # 💻 Frontend Storefront (Next.js 16, React 19)
│   │   └── src/
│   │       ├── app/       # App Router đa ngôn ngữ /[locale] (Routing & Layout layer)
│   │       │   └── [locale]/
│   │       │       ├── (store)/  # Nhóm trang bán hàng (home, products, cart...)
│   │       │       ├── (auth)/   # Nhóm trang xác thực (login, signin...)
│   │       │       └── (admin)/  # Nhóm trang quản trị
│   │       ├── components/# Các UI component dùng chung toàn cục (Global UI)
│   │       ├── features/  # Module nghiệp vụ tách biệt (Feature-based Architecture)
│   │       │   └── products/ # Ví dụ: Module quản lý sản phẩm
│   │       ├── i18n/      # Cấu hình đa ngôn ngữ (Localization)
│   │       ├── lib/       # Cấu hình các thư viện (như axios client, utils...)
│   │       └── types/     # Định nghĩa kiểu dùng chung cho frontend
│   └── api/               # ⚙️ Backend API (Express.js, TypeScript) - Modular Monolith
│       ├── .env.example   # File mẫu cấu hình biến môi trường của API & DB
│       └── src/
│           ├── index.ts   # Entrypoint khởi chạy API server & gắn middleware toàn cục
│           ├── routes.ts  # Bộ định tuyến trung tâm (central router)
│           ├── modules/   # Các module nghiệp vụ tự đóng gói (Self-contained)
│           │   └── auth/  # Ví dụ: Module xác thực (routes, controller, service, schema)
│           └── shared/    # Các thành phần dùng chung (config, middlewares, utils)
├── packages/
│   └── db/                # 🗄️ Database layer dùng chung (@repo/db)
│       ├── prisma/
│       │   └── schema.prisma # Định nghĩa cấu hình DB Schema (PostgreSQL)
│       └── src/
│           └── index.ts   # Khởi tạo Prisma Client instance dùng chung
├── docker-compose.yml     # Khởi chạy dịch vụ phụ trợ (Redis) bằng Docker
├── package.json           # Các script chạy chung của toàn bộ workspace
└── pnpm-workspace.yaml    # Khai báo các package trong workspace
```

### 💻 Thiết kế Frontend (Feature-based Architecture)

Frontend nằm tại [`apps/web`](file:///E:/draftcode/learn-ecommerce-shop/apps/web) được thiết kế theo kiến trúc **Feature-based**, giúp dễ dàng mở rộng và bảo trì bằng cách đóng gói các thành phần giao diện và logic có liên quan chặt chẽ vào từng module chức năng (Features):

*   **`features/`**: Mỗi thư mục con đại diện cho một chức năng nghiệp vụ của hệ thống (ví dụ: `auth`, `products`, `cart`, `checkout`). Cấu trúc bên trong mỗi feature tuân thủ nguyên tắc tự đóng gói:
    *   `components/`: Các React component phục vụ riêng cho tính năng đó.
    *   `api/`: Các truy vấn API, query/mutation hooks phục vụ riêng cho dữ liệu của feature.
    *   `hooks/`: Các custom hooks chứa logic nghiệp vụ và state riêng biệt.
    *   `types/`: Định nghĩa kiểu dữ liệu TS cho riêng feature.
    *   `index.ts`: Điểm xuất khẩu (export) duy nhất. Chỉ những gì được export ở đây mới có thể được import sử dụng ở bên ngoài module (tránh việc import sâu gây rối mã nguồn).
*   **`app/[locale]/`**: Đóng vai trò là lớp Router (routing layer) và Layout. Lớp này chỉ import các features từ thư mục `features/` để lắp ráp thành một trang hoàn thiện, hạn chế viết trực tiếp logic nghiệp vụ hay UI lớn tại đây.

### ⚙️ Thiết kế Backend (Modular Monolith)

Backend API nằm tại [`apps/api`](file:///E:/draftcode/learn-ecommerce-shop/apps/api) được chia thành các cấu trúc thành phần rõ ràng:

*   **`modules/`**: Chứa các module chức năng độc lập. Mỗi module tự chịu trách nhiệm về logic của riêng mình và bao gồm:
    *   `*.routes.ts`: Khai báo các endpoints cho module đó.
    *   `*.controller.ts`: Xử lý HTTP request/response và nhận/phản hồi dữ liệu.
    *   `*.service.ts`: Xử lý logic nghiệp vụ chính (Business logic) và tương tác database qua Prisma.
    *   `*.schema.ts`: Định nghĩa và kiểm tra (validate) định dạng dữ liệu gửi lên (sử dụng Zod).
*   **`shared/`**: Chứa các phần dùng chung cho tất cả các module trong ứng dụng:
    *   `config/`: Chứa các cấu hình toàn cục (như cấu hình các biến môi trường validated qua Zod).
    *   `middlewares/`: Chứa các middleware dùng chung như `authGuard` (xác thực token), `errorHandler` (bắt và xử lý lỗi tập trung) và `validate` (validate dữ liệu đầu vào).
    *   `utils/`: Chứa các hàm tiện ích (như xử lý password, ký và kiểm tra JWT token).

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
    *   **React Hot Toast:** Hệ thống thông báo (Toaster alerts) đẹp mắt.
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
    *   **IoRedis (v6.0.0):** Kết nối đến máy chủ Redis để quản lý session và lưu trữ OTP.
    *   **Nodemailer (v9.0.5):** Gửi email chứa mã xác thực OTP hoặc hóa đơn mua hàng.
    *   **Cors (v2.8.6):** Middleware kiểm soát chính sách chia sẻ tài nguyên nguồn gốc chéo an toàn.
*   **Xác Thực Đầu Vào & Tài Liệu:**
    *   **Zod (v4.4.3):** Middleware kiểm tra kiểu dữ liệu đầu vào của các API request.
    *   **Swagger JSDoc & Swagger UI Express:** Tự động biên dịch comment JSDoc thành file đặc tả OpenAPI và hiển thị thành giao diện Web UI chuyên nghiệp tại route `/api-docs`.

### 🗄️ Database Layer (`packages/db`)

*   **Prisma ORM (v5.12.0):** Bộ công cụ ORM thế hệ mới giúp thao tác dữ liệu qua các hàm TypeScript cực kỳ an toàn mà không cần viết SQL thuần.
*   **PostgreSQL:** Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ lưu giữ mọi thông tin nghiệp vụ.
*   **Dotenv-cli:** Giúp nạp động file môi trường phục vụ cho các câu lệnh migrate và generate của Prisma.

---

## 📦 Hướng Dẫn Cài Đặt Chung Chi Tiết

Vui lòng chuẩn bị sẵn các môi trường sau trước khi cài đặt:
- **Node.js** phiên bản từ `18.x` trở lên.
- **PNPM** cài đặt toàn cục: `npm install -g pnpm`.
- **Docker Desktop** (dành cho chạy Redis và các dịch vụ phụ trợ).
- Một cơ sở dữ liệu **PostgreSQL** (chạy local hoặc cloud).

### Các bước cài đặt:

1. **Tải mã nguồn về máy cục bộ:**
   ```bash
   git clone <url-kho-chua-cua-ban>
   cd learn-ecommerce-shop
   ```

2. **Cài đặt toàn bộ dependencies trong monorepo:**
   Sử dụng PNPM để cài đặt đồng thời thư viện cho cả root, web, api và db:
   ```bash
   pnpm install
   ```

3. **Cấu hình các biến môi trường:**
   Sao chép file cấu hình mẫu `.env.example` thành file cấu hình chính thức `.env` đặt bên trong thư mục [`apps/api`](file:///E:/draftcode/learn-ecommerce-shop/apps/api):
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

4. **Khai báo thông số trong file `apps/api/.env`:**
   Mở file [`apps/api/.env`](file:///E:/draftcode/learn-ecommerce-shop/apps/api/.env) và điền đầy đủ các thông số sau:
   ```env
   PORT=3001
   NODE_ENV=development
   
   # Kết nối CSDL PostgreSQL (Hãy thay thế bằng thông tin của bạn)
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public"
   
   # Cấu hình khóa bảo mật JWT (Dạng chuỗi Base64 hoặc ký tự bảo mật)
   JWT_PRIVATE_KEY="chuỗi_private_key_của_bạn"
   JWT_PUBLIC_KEY="chuỗi_public_key_của_bạn"
   JWT_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"
   
   # URL Frontend để cấu hình CORS
   FRONTEND_URL="http://localhost:3000"

   # Cấu hình kết nối tới Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   OTP_TTL_SECONDS=300
   ```

---

## 🚀 Hướng Dẫn Khởi Chạy Từng Phần & Câu Lệnh Chi Tiết

**⚠️ QUAN TRỌNG:** Để dự án không bị lỗi kết nối, bạn **bắt buộc** phải khởi chạy các dịch vụ theo đúng thứ tự 4 bước sau:

### Step 1: Khởi chạy dịch vụ phụ trợ (Redis Container)
Chạy dịch vụ Redis trên máy ảo Docker thông qua Docker Compose ở thư mục gốc:
```bash
docker compose up -d
```
*   **Giải thích:** Lệnh này tải ảnh `redis:7-alpine` và khởi động một Redis server chạy ngầm ở cổng `6379`. Dùng làm kho chứa tạm mã OTP gửi đến điện thoại/email khách hàng.
*   **Các lệnh bổ trợ hữu ích:**
    *   *Dừng dịch vụ:* `docker compose down`
    *   *Xem nhật ký hoạt động (Logs):* `docker compose logs -f redis`
    *   *Kiểm tra dữ liệu bên trong:* `docker exec -it shop-redis redis-cli` (gõ `keys *` để xem toàn bộ dữ liệu đang cache).

### Step 2: Khởi tạo và Đồng bộ hóa Cơ sở dữ liệu (PostgreSQL & Prisma)
Khi database PostgreSQL của bạn đã được bật, chạy các lệnh sau từ thư mục gốc của monorepo:

1. **Khởi tạo mã nguồn Prisma Client (TypeScript Types):**
   ```bash
   pnpm db:generate
   ```
   *   **Tác dụng:** Lệnh này đọc file `schema.prisma` và tự động biên dịch thành các kiểu dữ liệu TypeScript tương ứng cho ứng dụng sử dụng.

2. **Chạy Migration để tạo cấu trúc bảng:**
   ```bash
   pnpm db:migrate
   ```
   *   **Tác dụng:** Đồng bộ các bảng như `User`, `Product`, `Order`... vào database PostgreSQL local của bạn.

3. **Khởi tạo dữ liệu mẫu (Seeding):**
   ```bash
   pnpm --filter @repo/db seed
   ```
   *   **Tác dụng:** Thực thi file `seed.ts` để tạo tài khoản Admin mặc định đăng nhập hệ thống: **Email:** `admin@gmail.com` / **Mật khẩu:** `123`.

### Step 3: Khởi chạy Backend API Server (Express.js)
Để bắt đầu chạy server API, thực thi câu lệnh sau tại thư mục gốc:
```bash
pnpm --filter @repo/api dev
```
*   **Giải thích:** Lệnh này chạy server bằng công cụ `tsx` để theo dõi và cập nhật trực tiếp thay đổi trong thư mục `apps/api`.
*   **Đầu ra:**
    *   API chạy tại địa chỉ: [http://localhost:3001](http://localhost:3001)
    *   Giao diện tài liệu Swagger API: [http://localhost:3001/api-docs](http://localhost:3001/api-docs) (Nơi bạn có thể test trực tiếp các API đăng nhập, lấy sản phẩm).

### Step 4: Khởi chạy Frontend Web Storefront (Next.js)
Để chạy giao diện website Next.js, thực thi câu lệnh sau tại thư mục gốc:
```bash
pnpm --filter @repo/web dev
```
*   **Giải thích:** Khởi chạy máy chủ phát triển Next.js.
*   **Đầu ra:**
    *   Truy cập giao diện Web tại địa chỉ: [http://localhost:3000](http://localhost:3000) (Hệ thống sẽ tự nhận diện ngôn ngữ và điều hướng về `/vi` hoặc `/en`).

---

## ⚡ Lệnh Chạy Toàn Bộ Dự Án Song Song (Cách Nhanh Nhất)

Sau khi bạn đã hoàn thành việc setup Database ở lần đầu, ở những lần chạy sau, bạn chỉ cần thực hiện 2 lệnh siêu nhanh sau để mở dự án:

1. **Bật Redis:**
   ```bash
   docker compose up -d
   ```
2. **Khởi chạy đồng thời cả FE Web & BE API:**
   ```bash
   pnpm dev
   ```
   *Lệnh này sẽ tự động chạy song song hai câu lệnh ở Step 3 và Step 4 mà không cần bạn phải mở nhiều cửa sổ terminal khác nhau.*
