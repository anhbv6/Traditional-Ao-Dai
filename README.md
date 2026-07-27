# 🌸 Traditional Ao Dai - Vietnamese Traditional Ao Dai E-commerce Webshop
*(Vietnamese version below / Phiên bản Tiếng Việt ở phía dưới)*

A modern and smooth e-commerce platform specializing in Vietnamese traditional, customized, and wedding Ao Dai. The platform supports custom measurements for tailoring. Built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and multi-language support (**next-intl**).

---

## ✨ Key Features

- 🌐 **Multi-language (i18n):** Smooth switching between English and Vietnamese via the `/[locale]` routing.
- 🛍️ **Immersive Shopping Experience:**
  - Modern UI, fully responsive on both Desktop and Mobile.
  - Smooth scrolling (Lenis Smooth Scroll) and fluid animations (Framer Motion).
  - Elegant product and collection presentation using Embla Carousel.
- 📐 **Tailoring Support (Custom Measurement):** Customers can input their body measurements (in cm) when placing orders for a custom fit.
- 🛒 **Full E-commerce capabilities:**
  - Cart & Wishlist management.
  - Product Comparison & Quick View.
  - Checkout flow & User Profile page.
- 📰 **Blog & Articles:** Informative articles on Ao Dai culture and garment care.
- 🔐 **Admin Dashboard:** Separated `/admin` route group, ready for back-office management.

---

## 🛠️ Technology Stack

Built with the latest modern web technologies:

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

---

## 📦 Setup & Installation

### Prerequisites
- Node.js >= 18.x
- npm or yarn/pnpm

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/username/project-name.git
   cd project-name
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.*

4. **Build the application for production:**
   ```bash
   npm run build
   ```

5. **Start production server:**
   ```bash
   npm run start
   ```

---

## 📂 Main Directory Structure

```text
src/
├── app/                  # Next.js App Router & Layouts
│   └── [locale]/         # Multi-language locale routing
│       ├── (admin)/      # Route Group for Admin pages
│       ├── (auth)/       # Route Group for Authentication
│       └── (store)/      # Route Group for Storefront (Home, Shop, Cart...)
├── components/           # Reusable UI components
├── features/             # Feature modules (products, news...)
├── i18n/                 # Localization configurations (next-intl)
├── lib/                  # Shared utilities and configurations
└── types/                # TypeScript type definitions
messages/                 # Translation source files (vi.json, en.json)
```

---
---

# 🌸 Traditional Ao Dai - Cửa Hàng Áo Dài Truyền Thống

Nền tảng thương mại điện tử hiện đại, mượt mà chuyên cung cấp các sản phẩm Áo dài truyền thống, áo dài cách tân, áo dài cưới,... được thiết kế tinh xảo, hỗ trợ đặt may theo số đo riêng. Xây dựng trên nền tảng **Next.js 16**, **React 19**, **Tailwind CSS v4** và hỗ trợ đa ngôn ngữ (**next-intl**).

---

## ✨ Tính năng chính

- 🌐 **Đa ngôn ngữ (i18n):** Hỗ trợ chuyển đổi mượt mà giữa Tiếng Anh và Tiếng Việt thông qua hệ thống route `/[locale]`.
- 🛍️ **Trải nghiệm mua sắm mượt mà:**
  - Giao diện hiện đại, responsive hoàn hảo trên cả Desktop và Mobile.
  - Hiệu ứng cuộn mượt mà (Lenis Smooth Scroll) và chuyển động sinh động (Framer Motion).
  - Trình chiếu bộ sưu tập & sản phẩm đẹp mắt với Embla Carousel.
- 📐 **Hỗ trợ May đo (Custom Measurement):** Cho phép người dùng nhập trực tiếp số đo cơ thể (cm) khi đặt hàng để may đo riêng.
- 🛒 **Tính năng E-commerce đầy đủ:**
  - Quản lý giỏ hàng (Cart) & Danh sách yêu thích (Wishlist).
  - So sánh sản phẩm (Product Compare) & Xem nhanh sản phẩm (Quick View).
  - Luồng Thanh toán (Checkout) & Trang Cá nhân (Profile).
- 📰 **Bản tin & Cẩm nang:** Blog chia sẻ kiến thức về văn hóa áo dài và cách bảo quản.
- 🔐 **Hệ thống Admin Dashboard:** Cấu trúc route `/admin` riêng biệt sẵn sàng cho việc mở rộng quản trị.

---

## 🛠️ Công nghệ sử dụng

Dự án được xây dựng với những công nghệ hiện đại nhất:

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

---

## 📦 Hướng dẫn cài đặt & Khởi chạy

### Điều kiện cần
- Node.js >= 18.x
- npm hoặc yarn/pnpm

### Các bước thực hiện

1. **Clone repository:**
   ```bash
   git clone https://github.com/username/project-name.git
   cd project-name
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Chạy môi trường phát triển (Development):**
   ```bash
   npm run dev
   ```
   *Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để xem kết quả.*

4. **Xây dựng ứng dụng cho Production:**
   ```bash
   npm run build
   ```

5. **Chạy ứng dụng Production:**
   ```bash
   npm run start
   ```

---

## 📂 Cấu trúc thư mục chính

```text
src/
├── app/                  # Next.js App Router & Layouts
│   └── [locale]/         # Hỗ trợ đa ngôn ngữ locale
│       ├── (admin)/      # Route Group cho trang Quản trị (Admin)
│       ├── (auth)/       # Route Group cho trang Xác thực
│       └── (store)/      # Route Group cho trang Cửa hàng (Shop)
├── components/           # Các UI component dùng chung toàn hệ thống
├── features/             # Các feature module riêng biệt (products, news...)
├── i18n/                 # Cấu hình đa ngôn ngữ (next-intl)
├── lib/                  # Thư viện tiện ích, cấu hình dùng chung
└── types/                # Định nghĩa kiểu dữ liệu TypeScript
messages/                 # File dịch đa ngôn ngữ (vi.json, en.json)
```
