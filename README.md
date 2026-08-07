# 🌸 Traditional Ao Dai - Vietnamese Traditional Ao Dai E-commerce Webshop

Nền tảng thương mại điện tử chuyên nghiệp cung cấp Áo dài truyền thống, cách tân, áo dài cưới và dịch vụ **đặt may theo số đo riêng (Custom Measurement)**. 

Dự án được xây dựng theo kiến trúc **PNPM Monorepo** phân tách rõ ràng giữa Frontend (Next.js), Backend (Express) và Database (Prisma).

---

## 🏗️ Cấu Trúc Monorepo & Trạng Thái Hiện Tại

```text
learn-ecommerce-shop/
├── apps/
│   ├── web/               # 💻 Frontend (Next.js 16, React 19, Tailwind CSS v4)
│   │   └── src/
│   │       ├── app/       # Hệ thống App Router hỗ trợ đa ngôn ngữ /[locale]
│   │       └── features/  # Chứa các component & logic chia theo module chức năng
│   └── api/               # ⚙️ Backend REST API (Express.js, TypeScript)
│       └── src/
│           └── index.ts   # Điểm khởi chạy API (Hiện chỉ có health check & get user cơ bản)
├── packages/
│   └── db/                # 🗄️ Database Shared Package (@repo/db)
│       ├── prisma/
│       │   └── schema.prisma # Cấu hình Prisma Schema (Hiện mới chỉ có bảng User)
│       └── src/
│           └── index.ts   # Khởi tạo Prisma Client dùng chung cho API
├── .env.example           # File mẫu biến môi trường ở thư mục gốc
├── package.json           # Các script chạy chung của toàn bộ workspace
└── pnpm-workspace.yaml    # Khai báo các gói trong workspace
```

---

## 🛠️ Công Nghệ & Thư Viện Sử Dụng

### Monorepo Tooling
*   **PNPM Workspaces**: Trình quản lý package hiệu năng cao hỗ trợ cấu trúc Monorepo.

### Frontend (`apps/web`)
*   **Next.js 16 (App Router) & React 19**: Core framework dựng giao diện và tối ưu hóa SEO/SSR.
*   **TypeScript (v5)**: Đảm bảo kiểm soát kiểu dữ liệu an toàn.
*   **Tailwind CSS (v4) & PostCSS**: Thiết kế giao diện utility-first hiện đại.
*   **Tailwind Merge & Class Variance Authority (CVA)**: Quản lý và tùy biến các class CSS dễ dàng.
*   **Motion (Framer Motion 12)**: Thư viện tạo hiệu ứng chuyển động mượt mà.
*   **Lenis Smooth Scroll**: Hiệu ứng cuộn trang mượt mà.
*   **OGL (WebGL Library)**: Render hiệu ứng canvas 2D/3D hiệu năng cao.
*   **DotLottie React & React UseAnimations**: Phát các animation Lottie và micro-interactions.
*   **Next-intl**: Hỗ trợ đa ngôn ngữ (Localization/i18n).
*   **Embla Carousel React**: Thư viện làm slider/carousel kéo vuốt mượt mà.
*   **Base UI React & Vaul**: Các component nguyên bản (Primitives) và Drawer/Modal tiện lợi.
*   **React Day Picker & Smastrom React Rating**: Component lịch và đánh giá sao (rating).
*   **React Hot Toast**: Hiển thị thông báo (toast alerts) nhanh chóng.
*   **Date-fns**: Xử lý và định dạng thời gian.

### Backend (`apps/api`)
*   **Express.js**: Framework dựng API RESTful nhanh gọn.
*   **TSX**: Chạy trực tiếp các file TypeScript trong môi trường phát triển.
*   **@repo/db**: Thư viện kết nối database dùng chung trong monorepo.

### Database (`packages/db`)
*   **Prisma ORM**: Trình ánh xạ quan hệ đối tượng giúp thao tác database dễ dàng.
*   **PostgreSQL**: Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ.

---

## 📝 DANH SÁCH VIỆC CẦN LÀM (TODO LIST)

### 1. Database & Backend API
- [ ] **Mở rộng Schema Database (`packages/db/prisma/schema.prisma`)**:
  - [ ] Bảng `Product` & `Category` (quản lý sản phẩm áo dài, danh mục, giá, hình ảnh, size).
  - [ ] Bảng `Order` & `OrderItem` (**Đặc biệt thêm các trường lưu số đo may riêng**: ngực, eo, mông, chiều cao, cân nặng, độ dài áo/quần...).
  - [ ] Bảng `Cart` & `CartItem` (đồng bộ giỏ hàng).
  - [ ] Bảng `Review` (đánh giá sản phẩm).
- [ ] **Phát triển API RESTful (`apps/api`)**:
  - [ ] Hệ thống Authentication (Đăng ký, đăng nhập, phân quyền Admin JWT).
  - [ ] API Products (Tìm kiếm, bộ lọc danh mục, chi tiết sản phẩm).
  - [ ] API Orders & Checkout (Xử lý đơn hàng kèm dữ liệu số đo tự chọn).
  - [ ] API Admin (Quản lý kho hàng, đơn hàng, khách hàng).

### 2. Frontend Storefront (`apps/web`)
- [ ] **Tích hợp Đa Ngôn Ngữ (i18n)**: Hoàn thiện các file dịch trong thư mục `messages/` cho cả Tiếng Anh và Tiếng Việt.
- [ ] **Trang Chi Tiết Sản Phẩm & Form Đo**:
  - [ ] Thiết kế form chọn Size tiêu chuẩn hoặc nhập số đo cá nhân (Bust, Waist, Hips, Height, Weight...).
  - [ ] Thêm hình ảnh/hướng dẫn cách đo trực quan cho khách hàng dễ thực hiện.
- [ ] **Giỏ hàng & Thanh toán**:
  - [ ] Thiết lập state lưu trữ giỏ hàng, thông tin số đo đã nhập.
  - [ ] Luồng Checkout, chọn phương thức giao hàng và xác nhận đơn hàng.
- [ ] **Trang Admin Dashboard**:
  - [ ] Trang danh sách đơn hàng để admin xem số đo chi tiết của khách và gửi cho xưởng may.
  - [ ] Quản lý thêm/sửa/xóa sản phẩm và danh mục.

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### Điều kiện cần
- Node.js >= 18.x
- Cài đặt sẵn PNPM: `npm install -g pnpm`
- Cơ sở dữ liệu PostgreSQL đang chạy

### Các bước cài đặt

1. **Clone repository và cài đặt thư viện**:
   ```bash
   git clone <url-du-an>
   cd learn-ecommerce-shop
   pnpm install
   ```

2. **Cấu hình môi trường**:
   Sao chép file `.env.example` thành `.env` tại thư mục gốc và cấu hình kết nối database của bạn:
   ```bash
   cp .env.example .env
   ```
   *Chỉnh sửa file `.env`*:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce?schema=public"
   PORT=3001
   ```

3. **Khởi tạo Database**:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

4. **Khởi chạy môi trường phát triển (Chạy song song cả FE và BE)**:
   ```bash
   pnpm dev
   ```
   *   **Frontend Web**: [http://localhost:3000](http://localhost:3000)
   *   **Backend API**: [http://localhost:3001](http://localhost:3001)

### Các lệnh chạy riêng lẻ (nếu cần)
*   **Chỉ chạy Web Frontend**: `pnpm --filter @repo/web dev`
*   **Chỉ chạy Backend API**: `pnpm --filter @repo/api dev`
*   **Tạo lại Prisma Client**: `pnpm --filter @repo/db generate`
