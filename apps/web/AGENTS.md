# ==========================================
# FRONTEND WEB — WORKSPACE RULES (@repo/web)
# ==========================================

# 1. Cảnh báo: Next.js 16 + React 19
- Dự án dùng Next.js 16.2.10 (App Router) + React 19.2.4.
- PHẢI đọc docs tại `node_modules/next/dist/docs/` trước khi viết code liên quan Next.js.
- Mặc định sử dụng React Server Components (RSC). Chỉ thêm `"use client"` khi thực sự cần.

# 2. Kiến trúc: Feature-Based
- Mỗi feature nằm trong `src/features/<tên-feature>/` và tự chứa components, hooks, utils riêng.
- Features hiện tại: about, auth, cart, checkout, contact, faqs, home, news, products, profile, upload, wishlist.
- Components dùng chung nằm trong `src/components/`.
- Utilities dùng chung nằm trong `src/lib/`.
- Types dùng chung nằm trong `src/types/`.

# 3. Routing (App Router)
- Cấu trúc: `src/app/[locale]/` (i18n routing qua next-intl).
- Route Groups:
  - `(store)/` — Trang cửa hàng (trang chủ, sản phẩm, giỏ hàng...).
  - `(auth)/` — Trang đăng nhập, đăng ký.
  - `(admin)/` — Trang quản trị.

# 4. Styling & UI Components
- **Tailwind CSS v4** — KHÔNG dùng v3 syntax. Import qua `@tailwindcss/postcss`.
- **shadcn/ui** (style: base-vega) — Thêm component mới qua CLI. Config tại `components.json`.
- **Base UI (@base-ui/react)** — Headless UI components.
- **CVA (class-variance-authority)** + **tailwind-merge** — Tạo component variants.
- **Icons:** lucide-react (primary) + react-icons.
- Path alias: `@/*` → `./src/*`.

# 5. State Management
- **Server state:** TanStack React Query v5 — Dùng cho mọi API calls.
- **Client state:** Zustand v5 — Dùng cho UI state (cart, auth, preferences).
- KHÔNG dùng Redux, Context API cho state phức tạp.

# 6. Forms & Validation
- React Hook Form + Zod v4 (qua `@hookform/resolvers`).
- Schema validation phải nhất quán với backend Zod schemas.

# 7. i18n (Đa ngôn ngữ)
- Thư viện: next-intl v4.
- Locales: `vi` (Việt), `en` (Anh).
- File dịch nằm trong `messages/vi/` và `messages/en/`.
- Config: `src/i18n/request.ts` và `src/i18n/routing.ts`.

# 8. Animations
- **Framer Motion 12** (import từ `motion`) — Animation chính.
- **Lenis** — Smooth scrolling.
- **OGL** — WebGL effects.
- **Lottie (@lottiefiles/dotlottie-react)** — Lottie animations.

# 9. Scripts & Lệnh
- `pnpm --filter @repo/web dev` — Chạy Next.js dev server.
- `pnpm --filter @repo/web build` — Build production.
- `pnpm --filter @repo/web lint` — Chạy ESLint (flat config, `eslint.config.mjs`).
