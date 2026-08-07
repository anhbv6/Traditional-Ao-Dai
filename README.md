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
│   │       │       ├── components/ # React components riêng biệt cho feature
│   │       │       ├── api/        # Logic gọi API/fetching liên quan
│   │       │       ├── hooks/      # Custom hooks của riêng feature
│   │       │       ├── data/       # Dữ liệu tĩnh hoặc cấu hình cục bộ
│   │       │       ├── types/      # Các định nghĩa kiểu (TypeScript types)
│   │       │       └── index.ts    # Public API của feature (nơi export component ra ngoài)
│   │       ├── i18n/      # Cấu hình đa ngôn ngữ (Localization)
│   │       ├── lib/       # Cấu hình các thư viện (như axios client, utils...)
│   │       └── types/     # Định nghĩa kiểu dùng chung cho frontend
│   └── api/               # ⚙️ Backend API (Express.js, TypeScript) - Modular Monolith
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
├── .env.example           # File mẫu biến môi trường ở thư mục gốc
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
    *   `data/`: Dữ liệu tĩnh hoặc cấu hình cục bộ.
    *   `index.ts`: Điểm xuất khẩu (export) duy nhất. Chỉ những gì được export ở đây mới có thể được import sử dụng ở bên ngoài module (tránh việc import sâu gây rối mã nguồn).
*   **`app/[locale]/`**: Đóng vai trò là lớp Router (routing layer) và Layout. Lớp này chỉ import các features từ thư mục `features/` để lắp ráp thành một trang hoàn thiện, hạn chế viết trực tiếp logic nghiệp vụ hay UI lớn tại đây.
*   **`components/` (ở ngoài cùng `src`)**: Chứa các component dùng chung cho toàn ứng dụng (ví dụ: `Header`, `Footer`, `Button` dùng chung, `TextField`, v.v.).

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
