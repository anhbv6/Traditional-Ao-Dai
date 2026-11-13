# 🌸 Thiên Canh — Tiệm Áo Dài Truyền Thống

> *"Canh vải dưới trời mây, khâu tay từng tấc lụa."*  
> *"Weaving fabric beneath the clouds, hand-stitching every inch of silk."*

🌐 **Languages / Ngôn ngữ:** [🇻🇳 Tiếng Việt](#-tiếng-việt) | [🇬🇧 English](#-english)

---

## 🇻🇳 Tiếng Việt

### Giới thiệu dự án
**Thiên Canh** là nền tảng thương mại điện tử chuyên biệt dành cho thương hiệu áo dài truyền thống Việt Nam, khởi nguồn cảm hứng từ vùng cao Tây Bắc. Dự án không chỉ là một trang mua sắm thời trang may sẵn thông thường mà là giải pháp toàn diện kết hợp giữa **thương mại điện tử hiện đại** và **quy trình may đo thủ công cá nhân hóa (Bespoke Tailoring)**.

Hệ thống được xây dựng theo kiến trúc Monorepo phân tách rõ ràng giữa **Storefront (Khách hàng)** và **Admin Portal (Khu quản trị xưởng & nhân sự)**, đảm bảo tính bảo mật cao, trải nghiệm người dùng tinh tế và hiệu năng tối đa.

---

### #1 Công nghệ sử dụng

Dự án sử dụng kiến trúc **Monorepo** quản lý bởi **pnpm 11**, toàn bộ mã nguồn viết bằng **TypeScript (Strict Mode)**:

#### 🖥️ Frontend (`apps/web`)
* **Framework:** Next.js 16 (App Router), React 19 (Server Components mặc định, Server Actions).
* **Styling & UI:** Tailwind CSS v4, Base UI, Lucide Icons, hiệu ứng chuyển động Motion 12 (`motion/react`), cuộn mượt Lenis.
* **State Management:** Zustand (Client state), TanStack React Query (Server state).
* **Đa ngôn ngữ & Form:** `next-intl` (hỗ trợ song ngữ Tiếng Việt & Tiếng Anh), React Hook Form kết hợp Zod schema.

#### ⚙️ Backend & API (`apps/api`)
* **Core:** Node.js 22+, Express 4 với thực thi siêu tốc qua `tsx` (Type-stripping).
* **Bảo mật & Xác thực:** JWT RS256 (cặp khóa bất đối xứng Asymmetric Keys), bảo vệ phiên làm việc qua HttpOnly Cookie, bảo vệ Header với Helmet, kiểm soát tần suất Rate Limiting với Redis.
* **Tài liệu & Tiện ích:** Swagger UI OpenAPI 3.0 (`/api-docs`), Multer (xử lý upload ảnh), Nodemailer / Brevo API.

#### 🗄️ Cơ sở dữ liệu & Gói dùng chung
* **Database & ORM (`packages/db`):** PostgreSQL (Neon Serverless) kết nối qua Prisma ORM 5 (hơn 30 models quan hệ chặt chẽ).
* **Hợp đồng dùng chung (`packages/shared`):** Định nghĩa DTO, bộ quy chuẩn kích thước & phụ phí may đo (`/sizing`), quy trình đơn hàng (`/orders`), báo giá thiết kế riêng (`/bespoke`), schema xác thực Zod (`/validation`).
* **Cấu hình chuẩn hóa (`packages/config`):** ESLint 9 Flat Config, TypeScript config kế thừa, Prettier.

---

### #2 Các chức năng đặc biệt

1. **Bộ máy may đo theo số đo & Báo giá tự động (Bespoke Tailoring Engine):**
   * Cho phép khách hàng tùy biến cấu hình chi tiết áo dài (kiểu cổ áo, tay áo, tà áo, phối chất liệu lụa/gấm).
   * Thuật toán tự động gợi ý kích cỡ dựa trên số đo 3 vòng, tính toán chính xác phụ phí may ngoại cỡ (Bigsize surcharge) và kiểm định tính hợp lệ của số đo trước khi tạo đơn.

2. **Theo dõi tiến độ xưởng may 5 công đoạn thời gian thực (Real-time Tailoring Tracking):**
   * Minh bạch hóa quy trình may đo thủ công qua 5 bước: *Chờ vải ➔ Cắt vải ➔ May ráp ➔ Đính kết/Thêu hoa ➔ Form dáng & Ủi*.
   * Khách hàng có thể tra cứu đơn hàng và theo dõi ảnh chụp thực tế tại xưởng thông qua **Magic Link bảo mật** (mã băm HMAC, không cần tạo tài khoản hay nhớ mật khẩu).

3. **Kiến trúc xác thực phiên kép độc lập (Dual-Zone Auth Architecture):**
   * **Khu vực Storefront:** Access Token trong bộ nhớ RAM kết hợp cơ chế xoay vòng Refresh Token (HttpOnly Cookie) kèm thời gian ân hạn 30 giây (Grace Period) chống xung đột khi mở nhiều tab.
   * **Khu vực Quản trị (Admin):** Xác thực nghiêm ngặt qua cookie `admin_token`, đối soát phiên DB thời gian thực từng request, cơ chế phân quyền ma trận 5 cấp bậc cho nhân viên (`Permission`).

4. **Quản trị danh mục thông minh với Sơ đồ cây tương tác (Dynamic Category Tree & Size Grid):**
   * Khu quản trị cung cấp sơ đồ cây danh mục trực quan có hiệu ứng kéo thả chuyển cấp, đồng bộ song song với bảng dữ liệu.
   * Trình soạn thảo bảng size mẫu hỗ trợ sao chép - dán trực tiếp từ bảng tính Excel, tự động nhận diện ngưỡng số đo hợp lệ.

5. **Thanh toán VietQR động & Quản lý đặt cọc may đo linh hoạt:**
   * Tự động sinh mã VietQR động theo chuẩn NAPAS với cú pháp chuyển khoản chính xác `THIENCANH <mã đơn>`, người mua quét mã là ngân hàng tự điền đủ số tiền và nội dung.
   * Hỗ trợ luồng đặt cọc trước 30% – 50% cho đơn may đo thủ công và thu COD phần còn lại khi nhận áo.

> 💡 *...Và còn nhiều phân hệ chuyên sâu khác: Quản lý kho vải lụa theo mét, Kho phụ liệu thời trang, Nhật ký kiểm toán viên (Audit Log), Trợ lý tư vấn AI "Thợ phụ Thiên Canh", Hệ thống phiếu giảm giá Voucher đa điều kiện, Lịch hẹn thử áo tại showroom, và Quy trình đổi trả - phê duyệt đa cấp.*

---

## 🇬🇧 English

### Project Overview
**Thiên Canh** is an e-commerce platform crafted exclusively for a traditional Vietnamese Ao Dai atelier originating from the Northwest highlands of Vietnam. Beyond a standard ready-to-wear fashion store, this platform is an end-to-end digital solution bridging **modern e-commerce** with **custom artisanal bespoke tailoring**.

Built with a modular Monorepo architecture, the project cleanly decouples the **Storefront (Customer experience)** from the **Admin Portal (Operations, tailoring atelier & staff management)** to guarantee top-tier security, high performance, and an exquisite user journey.

---

### #1 Tech Stack

Powered by a **pnpm 11 Monorepo** and strictly typed with **TypeScript**:

#### 🖥️ Frontend (`apps/web`)
* **Framework:** Next.js 16 (App Router), React 19 (Server Components by default, Server Actions for mutations).
* **Styling & UI:** Tailwind CSS v4, Base UI components, Lucide Icons, Motion 12 (`motion/react`) animations, Lenis smooth scrolling.
* **State Management:** Zustand (Client-side state), TanStack React Query (Server-side caching).
* **Internationalization & Forms:** `next-intl` (English & Vietnamese), React Hook Form paired with Zod validation.

#### ⚙️ Backend & API (`apps/api`)
* **Core Runtime:** Node.js 22+, Express 4 executed via `tsx` (Native TypeScript type-stripping).
* **Security & Auth:** RS256 Asymmetric JWT key pairs, HttpOnly session cookies, Helmet HTTP headers, Redis-backed Rate Limiting.
* **Utilities & Tooling:** Swagger UI OpenAPI 3.0 specification (`/api-docs`), Multer media uploader, Nodemailer / Brevo API.

#### 🗄️ Database & Shared Packages
* **Database & ORM (`packages/db`):** PostgreSQL (Neon Serverless) managed through Prisma ORM 5 (30+ relational models).
* **Shared Contracts (`packages/shared`):** Centralized DTOs, bespoke sizing calculation algorithms (`/sizing`), order lifecycle rules (`/orders`), custom price quotation (`/bespoke`), and Zod validation schemas (`/validation`).
* **Shared Tooling (`packages/config`):** ESLint 9 Flat Config, shared tsconfig bases, Prettier formatting rules.

---

### #2 Special Features & Key Highlights

1. **Bespoke Tailoring Engine & Automated Quotation:**
   * Empowers shoppers to customize Ao Dai components (collar, sleeve cuts, flap styles, and silk/brocade fabric pairings).
   * Intelligent algorithm recommending sizes based on customer measurements, calculating bigsize surcharges, and validating tailorability in real-time.

2. **5-Stage Real-time Atelier Tracking Timeline:**
   * Demystifies the bespoke manufacturing journey through 5 transparent phases: *Awaiting Fabric ➔ Cutting ➔ Sewing ➔ Embroidery & Beading ➔ Fitting & Ironing*.
   * Customers access progress photos and logs via **Secure Magic Links** (HMAC token hashes, zero login friction).

3. **Dual-Zone Independent Authentication Architecture:**
   * **Storefront Zone:** In-memory Access Tokens accompanied by rotating HttpOnly Refresh Tokens with a 30-second Grace Period for multi-tab support.
   * **Admin Zone:** Strict `admin_token` cookie verification validated against database sessions on every single request, fortified by a 5-tier role-permission matrix.

4. **Dynamic Interactive Category Tree & Size Chart Grid:**
   * Administrative portal featuring an interactive visual category tree with drag-and-drop reordering that mirrors live customer navigation.
   * Matrix size chart editor with direct Excel paste support, automated dimension boundaries, and bigsize threshold detectors.

5. **Dynamic VietQR Payment & Bespoke Deposit Processing:**
   * Automated dynamic VietQR generation (NAPAS standard) with deterministic transfer syntax (`THIENCANH <order-code>`).
   * Tailored order support requiring a 30%–50% bank transfer deposit before craftsmanship begins, collecting remainder via COD upon delivery.

> 💡 *...And many more specialized features: Per-meter raw silk and fabric inventory, Garment accessory warehouse, Comprehensive Audit Logging, AI Assistant "Thợ phụ Thiên Canh", Multi-tier discount vouchers, Showroom fitting appointments, and Multi-level return/refund approval pipelines.*
