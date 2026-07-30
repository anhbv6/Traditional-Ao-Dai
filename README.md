# 🌸 Traditional Ao Dai - Vietnamese Traditional Ao Dai E-commerce Webshop
*(Vietnamese version below / Phiên bản Tiếng Việt ở phía dưới)*

A modern and smooth e-commerce platform specializing in Vietnamese traditional, customized, and wedding Ao Dai. The platform supports custom measurements for tailoring. 

This project is built using a **PNPM Monorepo** architecture to cleanly separate the Frontend (Next.js), Backend (Express), and Database layer (Prisma).

---

## 🏗️ Monorepo Architecture

The project is structured as a monorepo managed by **PNPM Workspaces**:

```text
learn-ecommerce-shop/
├── apps/
│   ├── web/               # Frontend Storefront (Next.js 16, React 19)
│   │   └── src/
│   │       ├── app/       # App Router with multi-language /[locale] routing
│   │       ├── components/# Reusable UI components
│   │       └── features/  # Feature modules (products, cart, profile...)
│   └── api/               # Backend REST API (Express.js, TypeScript)
│       └── src/
│           └── index.ts   # Server entrypoint
├── packages/
│   └── db/                # Database layer shared package (@repo/db)
│       ├── prisma/
│       │   └── schema.prisma # Prisma Schema configuration (PostgreSQL)
│       └── src/
│           └── index.ts   # Shared Prisma Client instance
├── .env.example           # Root environment variable template
├── package.json           # Root workspace scripts
└── pnpm-workspace.yaml    # Workspace packages declaration
```

---

## ✨ Key Features

- 🌐 **Multi-language (i18n):** Smooth switching between English and Vietnamese via the `/[locale]` routing.
- 🛍️ **Immersive Shopping Experience:**
  - Modern UI, fully responsive on both Desktop and Mobile.
  - Smooth scrolling (Lenis Smooth Scroll) and fluid animations (Motion).
  - Elegant product and collection presentation using Embla Carousel.
- 📐 **Tailoring Support (Custom Measurement):** Customers can input their body measurements (in cm) when placing orders for a custom fit.
- 🛒 **Full E-commerce capabilities:**
  - Cart & Wishlist management.
  - Product Comparison & Quick View.
  - Checkout flow & User Profile page.
- 📰 **Blog & Articles:** Informative articles on Ao Dai culture and garment care.
- 🔐 **Admin Dashboard:** Separated `/admin` route group inside `apps/web`, ready for back-office management.
- 🔌 **Shared Database Client:** Schema and database client are managed centrally in `packages/db` and shared between the API and other packages.

---

## 🛠️ Technology Stack

### Monorepo Tooling
- **Package Manager:** [PNPM Workspaces](https://pnpm.io/workspaces)

### Frontend (`apps/web`)
- **Core Framework:** [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & PostCSS
- **Localization:** [next-intl](https://next-intl-docs.vercel.app/)
- **Animations:** 
  - [Motion (Framer Motion 12)](https://motion.dev/)
  - [Lenis](https://lenis.darkroom.engineering/) (Smooth Scroll)
  - [DotLottie React](https://lottiefiles.com/)
- **UI Components & Primitives:**
  - [Base UI React](https://base-ui.com/) (Component primitives)
  - [Vaul](https://github.com/emilkowalski/vaul) (Drawer/Modal)
  - [Embla Carousel](https://www.embla-carousel.com/) (Carousel/Slider)
  - [React Rating](https://github.com/smastrom/react-rating) (Star rating)
  - [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/) (Icon systems)

### Backend (`apps/api`)
- **Core Server:** [Express.js](https://expressjs.com/)
- **Runtime Compiler:** [TSX](https://github.com/privatenumber/tsx) (TypeScript Execute)
- **Database Connector:** `@repo/db` (Internal workspace package)

### Database Layer (`packages/db`)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database Engine:** [PostgreSQL](https://www.postgresql.org/)

---

## 📦 Setup & Installation

### Prerequisites
- Node.js >= 18.x
- [PNPM](https://pnpm.io/) installed globally (`npm install -g pnpm`)
- PostgreSQL database instance running

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/username/project-name.git
   cd project-name
   ```

2. **Configure Environment Variables:**
   Copy the `.env.example` file to `.env` in the project root and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```
   Modify `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce?schema=public"
   PORT=3001
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Initialize the Database:**
   Generate the Prisma client and run migrations to create tables in your PostgreSQL database:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. **Run the development servers:**
   To spin up the web frontend, the backend API, and watch for schema changes simultaneously:
   ```bash
   pnpm dev
   ```
   - **Frontend Web:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:3001](http://localhost:3001)

### Workspace Specific Commands

You can run commands for specific applications using the `--filter` flag:

- **Run only the frontend (Next.js):**
  ```bash
  pnpm --filter @repo/web dev
  ```
- **Run only the backend (Express API):**
  ```bash
  pnpm --filter @repo/api dev
  ```
- **Generate database artifacts:**
  ```bash
  pnpm --filter @repo/db generate
  ```

---

## 🚀 Production Deployment

1. **Build all applications:**
   ```bash
   pnpm build
   ```
2. **Start the production servers:**
   ```bash
   pnpm start
   ```

---
---

# 🌸 Traditional Ao Dai - Cửa Hàng Áo Dài Truyền Thống Việt Nam

Nền tảng thương mại điện tử hiện đại, mượt mà chuyên cung cấp các sản phẩm Áo dài truyền thống, áo dài cách tân, áo dài cưới,... được thiết kế tinh xảo, hỗ trợ đặt may theo số đo riêng của khách hàng.

Dự án này sử dụng kiến trúc **PNPM Monorepo** giúp phân tách rõ ràng giữa Frontend (Next.js), Backend (Express) và lớp Database (Prisma).

---

## 🏗️ Kiến Trúc Monorepo

Dự án được cấu trúc dưới dạng monorepo được quản lý bởi **PNPM Workspaces**:

```text
learn-ecommerce-shop/
├── apps/
│   ├── web/               # Ứng dụng Frontend Storefront (Next.js 16, React 19)
│   │   └── src/
│   │       ├── app/       # Cấu trúc App Router với đa ngôn ngữ /[locale]
│   │       ├── components/# Các UI component dùng chung
│   │       └── features/  # Các module tính năng (sản phẩm, giỏ hàng, cá nhân...)
│   └── api/               # Ứng dụng Backend REST API (Express.js, TypeScript)
│       └── src/
│           └── index.ts   # Điểm khởi chạy API server
├── packages/
│   └── db/                # Lớp cơ sở dữ liệu dùng chung (@repo/db)
│       ├── prisma/
│       │   └── schema.prisma # Cấu hình Prisma Schema (PostgreSQL)
│       └── src/
│           └── index.ts   # Khởi tạo Prisma Client dùng chung
├── .env.example           # File mẫu biến môi trường ở thư mục gốc
├── package.json           # Các script chạy chung của toàn workspace
└── pnpm-workspace.yaml    # Khai báo các package trong workspace
```

---

## ✨ Tính năng chính

- 🌐 **Đa ngôn ngữ (i18n):** Hỗ trợ chuyển đổi mượt mà giữa Tiếng Anh và Tiếng Việt thông qua hệ thống route `/[locale]`.
- 🛍️ **Trải nghiệm mua sắm mượt mà:**
  - Giao diện hiện đại, responsive hoàn hảo trên cả Desktop và Mobile.
  - Hiệu ứng cuộn mượt mà (Lenis Smooth Scroll) và chuyển động sinh động (Motion).
  - Trình chiếu bộ sưu tập & sản phẩm đẹp mắt với Embla Carousel.
- 📐 **Hỗ trợ May đo (Custom Measurement):** Cho phép người dùng nhập trực tiếp số đo cơ thể (cm) khi đặt hàng để may đo riêng.
- 🛒 **Tính năng E-commerce đầy đủ:**
  - Quản lý giỏ hàng (Cart) & Danh sách yêu thích (Wishlist).
  - So sánh sản phẩm (Product Compare) & Xem nhanh sản phẩm (Quick View).
  - Luồng Thanh toán (Checkout) & Trang Cá nhân (Profile).
- 📰 **Bản tin & Cẩm nang:** Blog chia sẻ kiến thức về văn hóa áo dài và cách bảo quản.
- 🔐 **Hệ thống Admin Dashboard:** Nhóm route `/admin` bên trong `apps/web` sẵn sàng cho việc mở rộng quản trị.
- 🔌 **Chia sẻ Client Kết nối DB:** Schema và client kết nối được quản lý tập trung tại package `@repo/db`, chia sẻ trực tiếp cho backend API.

---

## 🛠️ Công nghệ sử dụng

### Monorepo Tooling
- **Trình quản lý package:** [PNPM Workspaces](https://pnpm.io/workspaces)

### Frontend (`apps/web`)
- **Core Framework:** [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & PostCSS
- **Đa ngôn ngữ:** [next-intl](https://next-intl-docs.vercel.app/)
- **Hiệu ứng & Animation:** 
  - [Motion (Framer Motion 12)](https://motion.dev/)
  - [Lenis](https://lenis.darkroom.engineering/) (Smooth Scroll)
  - [DotLottie React](https://lottiefiles.com/)
- **UI Components & Thư viện bổ trợ:**
  - [Base UI React](https://base-ui.com/) (Component primitives)
  - [Vaul](https://github.com/emilkowalski/vaul) (Drawer/Modal)
  - [Embla Carousel](https://www.embla-carousel.com/) (Carousel/Slider)
  - [React Rating](https://github.com/smastrom/react-rating) (Đánh giá sao)
  - [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/) (Hệ thống icon)

### Backend (`apps/api`)
- **Server:** [Express.js](https://expressjs.com/)
- **Trình chạy code TS trực tiếp:** [TSX](https://github.com/privatenumber/tsx)
- **Thư viện DB kết nối nội bộ:** `@repo/db` (workspace package)

### Database Layer (`packages/db`)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Cơ sở dữ liệu:** [PostgreSQL](https://www.postgresql.org/)

---

## 📦 Hướng dẫn cài đặt & Khởi chạy

### Điều kiện cần
- Node.js >= 18.x
- Cài đặt sẵn [PNPM](https://pnpm.io/) trên máy (`npm install -g pnpm`)
- Cơ sở dữ liệu PostgreSQL đang hoạt động

### Các bước thực hiện

1. **Clone repository:**
   ```bash
   git clone https://github.com/username/project-name.git
   cd project-name
   ```

2. **Cấu hình biến môi trường:**
   Sao chép file `.env.example` thành `.env` tại thư mục gốc và điền các cấu hình kết nối database của bạn:
   ```bash
   cp .env.example .env
   ```
   Chỉnh sửa file `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce?schema=public"
   PORT=3001
   ```

3. **Cài đặt thư viện:**
   ```bash
   pnpm install
   ```

4. **Khởi tạo Cơ sở Dữ liệu:**
   Tạo Prisma client và chạy migration để đồng bộ các bảng cơ sở dữ liệu vào PostgreSQL:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. **Chạy môi trường phát triển (Development):**
   Lệnh này sẽ khởi chạy song song cả ứng dụng Web frontend, Backend API và tự động theo dõi thay đổi Prisma schema:
   ```bash
   pnpm dev
   ```
   - **Frontend Web:** Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.
   - **Backend API:** Chạy tại [http://localhost:3001](http://localhost:3001).

### Các lệnh chạy riêng cho từng ứng dụng

Bạn có thể chạy riêng các tác vụ của từng package thông qua tham số `--filter`:

- **Chỉ chạy Web Frontend:**
  ```bash
  pnpm --filter @repo/web dev
  ```
- **Chỉ chạy Backend API:**
  ```bash
  pnpm --filter @repo/api dev
  ```
- **Tạo lại Prisma Client cho package DB:**
  ```bash
  pnpm --filter @repo/db generate
  ```

---

## 🚀 Triển khai Production

1. **Build toàn bộ ứng dụng:**
   ```bash
   pnpm build
   ```
2. **Khởi chạy ứng dụng production:**
   ```bash
   pnpm start
   ```
