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
*   **Next.js v16.2.10 (App Router) & React v19.2.4**: Framework chính để dựng giao diện, tối ưu hoá SEO và kết xuất phía máy chủ (SSR).
*   **TypeScript**: Đảm bảo kiểm soát kiểu dữ liệu chặt chẽ và an toàn.
*   **Tailwind CSS v4 & PostCSS**: Viết CSS nhanh chóng, tối ưu hóa giao diện responsive.
*   **Zustand**: Quản lý trạng thái đăng nhập, giỏ hàng, thông tin phiên giao dịch.
*   **Next-intl v4**: Thư viện xử lý bản địa hoá và dịch đa ngôn ngữ (English / Tiếng Việt).
*   **Motion (Framer Motion 12) & Lenis**: Thiết lập hiệu ứng chuyển động chất lượng cao và cuộn trang mượt mà.
*   **Embla Carousel React**: Thư viện làm slider/carousel kéo vuốt mượt mà trên cả desktop và mobile.
*   **Base UI React & Vaul**: Cung cấp các component nguyên bản không có style (Primitives) và Drawer/Modal hiện đại.
*   **React Day Picker**: Component lịch trực quan để người dùng chọn ngày tháng.
*   **Smastrom React Rating**: Component đánh giá sao cho sản phẩm.
*   **React Hot Toast**: Hiển thị thông báo (toast alerts) dạng pop-up nhanh chóng.
*   **Date-fns**: Xử lý và định dạng thời gian.

### ⚙️ Backend API (`apps/api`)
*   **Express.js v4**: Bộ khung web server xử lý định tuyến (Routing) và API endpoints.
*   **TSX & TypeScript**: Chạy trực tiếp các file TypeScript trong môi trường phát triển và bảo vệ kiểu dữ liệu.
*   **Cors**: Middleware xử lý phân quyền chia sẻ tài nguyên nguồn gốc chéo (Cross-Origin Resource Sharing).
*   **Dotenv & Dotenv-cli**: Đọc và nạp các cấu hình môi trường từ file `.env` động.
*   **Bcryptjs**: Thư viện dùng để mã hoá (hash) mật khẩu của người dùng an toàn.
*   **Zod**: Xác thực dữ liệu đầu vào (Request validation) trước khi xử lý.
*   **Swagger UI Express**: Tự động sinh giao diện tài liệu hướng dẫn sử dụng API (API Specification).

### 🗄️ Database & Caching Layer
*   **PostgreSQL**: Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, tin cậy.
*   **Prisma ORM v5**: Công cụ lập bản đồ quan hệ đối tượng giúp kết nối và thao tác database dễ dàng.
*   **Redis v7**: Hệ thống lưu trữ dữ liệu trong bộ nhớ trong (In-memory cache) chạy độc lập qua Docker, phục vụ lưu cache mã OTP và giảm tải cho PostgreSQL.
*   **Docker & Docker Compose**: Công cụ đóng gói container để chuẩn hoá môi trường chạy cơ sở dữ liệu phụ trợ (Redis).

---

## 📦 Hướng Dẫn Cài Đặt Chung

### Điều kiện cần
- Node.js >= 18.x
- Cài đặt sẵn PNPM: `npm install -g pnpm`
- Đã cài đặt và khởi chạy **Docker Desktop** trên máy.

### Các bước chuẩn bị chung
1. **Clone repository về máy:**
   ```bash
   git clone <url-du-an>
   cd learn-ecommerce-shop
   ```
2. **Cài đặt dependencies toàn hệ thống:**
   ```bash
   pnpm install
   ```
3. **Thiết lập file cấu hình môi trường:**
   Sao chép file `.env.example` thành `.env` trong thư mục [`apps/api`](file:///E:/draftcode/learn-ecommerce-shop/apps/api):
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   *Mở file `apps/api/.env` ra và điền các thông tin kết nối DB PostgreSQL và Redis của bạn.*

---

## 🚀 Hướng Dẫn Khởi Chạy Từng Phần

Để quản lý dự án dễ dàng, bạn có thể khởi chạy từng dịch vụ riêng biệt theo thứ tự dưới đây:

### 🧩 Phần 1: Khởi chạy dịch vụ phụ trợ (Redis)
Dịch vụ Redis được đóng gói qua Docker. Tại thư mục gốc của dự án, hãy chạy:
```bash
docker compose up -d
```
*   **Kiểm tra trạng thái:** Dùng lệnh `docker compose ps` để đảm bảo container `shop-redis` đang chạy ở cổng `6379`.
*   **Dừng dịch vụ:** Khi không sử dụng nữa, chạy `docker compose down`.

---

### 🗄️ Phần 2: Đồng bộ và Khởi tạo Cơ sở dữ liệu (PostgreSQL)
Sau khi database PostgreSQL của bạn đã sẵn sàng hoạt động, hãy chạy các lệnh sau từ thư mục gốc:

1. **Sinh mã Prisma Client:**
   ```bash
   pnpm db:generate
   ```
2. **Đồng bộ cấu hình bảng (Migration):**
   ```bash
   pnpm db:migrate
   ```
3. **Khởi tạo dữ liệu mẫu (Seed) - Tạo tài khoản Admin mặc định:**
   ```bash
   pnpm --filter @repo/db seed
   ```
   *Tài khoản Admin mặc định sẽ được tạo là `admin@gmail.com` với mật khẩu `123`.*

---

### ⚙️ Phần 3: Khởi chạy Backend API Server
Để chạy máy chủ API (Express.js), thực hiện lệnh sau tại thư mục gốc:
```bash
pnpm --filter @repo/api dev
```
*   **Địa chỉ API:** Chạy tại [http://localhost:3001](http://localhost:3001)
*   **Tài liệu API (Swagger UI):** Xem trực quan cấu trúc và test các endpoint tại [http://localhost:3001/api-docs](http://localhost:3001/api-docs)

---

### 💻 Phần 4: Khởi chạy Frontend Web Client
Để chạy ứng dụng giao diện Next.js, thực hiện lệnh sau tại thư mục gốc:
```bash
pnpm --filter @repo/web dev
```
*   **Địa chỉ Web:** Truy cập tại [http://localhost:3000](http://localhost:3000)

---

## ⚡ Mẹo chạy nhanh toàn bộ dự án
Nếu bạn muốn chạy song song cả **Backend API** và **Frontend Web** cùng một lúc sau khi đã chuẩn bị xong cơ sở dữ liệu, chỉ cần chạy một lệnh duy nhất tại thư mục gốc:
```bash
pnpm dev
```

---

## 🐳 Các lệnh quản lý Docker & Redis hữu ích khi Debug
*   **Xem logs của container Redis:**
    ```bash
    docker compose logs -f redis
    ```
*   **Truy cập vào CLI của Redis để kiểm tra keys/OTP:**
    ```bash
    docker exec -it shop-redis redis-cli
    ```
    *Ví dụ gõ lệnh `keys *` để xem danh sách mã OTP đang lưu trong cache.*
