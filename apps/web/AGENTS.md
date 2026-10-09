# ==========================================
# FRONTEND WEB — WORKSPACE RULES (@repo/web)
# ==========================================

> Quy chuẩn chi tiết: [`docs/PROJECT_RULES.md`](../../docs/PROJECT_RULES.md) — §7 Frontend, §8 Admin, §10 i18n.

# 1. Cảnh báo: Next.js 16 + React 19
- Dự án dùng Next.js 16.2 (App Router) + React 19.2.
- PHẢI đọc docs tại `node_modules/next/dist/docs/` trước khi viết code liên quan Next.js (middleware giờ là `src/proxy.ts`, chạy Node runtime).
- Mặc định sử dụng React Server Components (RSC). Chỉ thêm `"use client"` khi thực sự cần.

# 2. Kiến trúc: Feature-Based
- Mỗi feature nằm trong `src/features/<tên-feature>/` gồm `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`, `validations/` và `index.ts(x)` là public API.
- Features hiện tại: about, admin, auth, cart, checkout, contact, faqs, home, news, products, profile, upload, wishlist.
- Ranh giới import: `lib/` và `components/ui|shared` KHÔNG import từ `features/`; import chéo feature qua `index`.
- Mỗi feature BẮT BUỘC có `index.ts`; dữ liệu mock để trong `data/` (không để trong `api/`); `types/` không import từ `components/`.
- Component: `components/ui` (shadcn), `components/effects` (animation từ registry), `components/shared` (dùng chung, không phụ thuộc feature), `components/common` (header/footer storefront).
- Utilities dùng chung: `src/lib/` (`api-client` — HTTP, `messages` — trích xuất/dịch/toast message, `utils` — `cn`, `resolveClassName`, `jwt.server`). Hook dùng chung: `src/hooks/` (`useNotify`, `useLocalStorageBoolean`).

# 3. Routing (App Router)
- Cấu trúc: `src/app/[locale]/` (i18n routing qua next-intl), route groups `(store)`, `(auth)`, `(admin)`.
- `src/proxy.ts`: i18n + chặn sớm `/admin` (xác minh chữ ký `admin_token`) và `/profile` (cookie `refreshToken`). Kiểm tra quyền thật luôn ở server (page/action).

# 4. Gọi API & Auth
- Trình duyệt gọi `/api/*` (Next rewrites → Express, cùng origin). Luôn dùng `apiClient` từ `@/lib/api-client`; ở server `apiClient` tự dùng `API_INTERNAL_URL`.
- **Khách hàng:** `features/auth/store/authStore` (access token trong bộ nhớ), khôi phục phiên trong `AppProviders` khi có cờ `has_session`, đăng nhập xong gọi `establishCustomerSession()`, đăng xuất qua `useCustomerLogout()`.
- **Admin:** `useAdminSession()` (đọc phiên từ server), KHÔNG dùng `authStore`.
- TUYỆT ĐỐI KHÔNG tự ghi `document.cookie` cho auth, KHÔNG lưu token/thông tin người dùng vào `localStorage` — cookie do Backend quản lý.

# 5. Khu vực Admin (gọi DB trực tiếp)
- Server Next cần `DATABASE_URL` trong `apps/web/.env` (cùng giá trị với `apps/api/.env`).
- Phân quyền: một nguồn duy nhất `features/admin/session/permissions.ts` (`ADMIN_MODULE_ACCESS`, `ADMIN_ACTION_ACCESS`, `canAccess`) dùng chung cho menu, page, action và UI.
- Giao diện: mọi trang dùng `AdminPage` + `AdminPageHeader` (`features/admin/ui`); quy chuẩn token tại `app/[locale]/(admin)/admin/variables.md`. Layout gắn class `admin-shell` (font Inter, reset kiểu chữ storefront).
- `features/admin/<module>/queries` (đọc Prisma, dùng ở Server Component) + `actions` (`"use server"`).
- Mọi Server Action gọi `authorizeAdminAction({ role?, permission? })` ở dòng đầu; mọi page đọc DB gọi `requireAdminPage()`.
- Người thực hiện lấy từ `auth.user.id`, không nhận từ client. Không trả `error.message` nội bộ — `error` luôn là mã KEY, client hiển thị qua `useNotify()`.
- Cấu trúc: `admin/<module>/{queries,actions,components,types}`, `admin/layout` (khung header/menu), `admin/session` (phiên, hồ sơ, PermissionGate), `admin/server` (kiểm tra quyền).
- Dữ liệu trả qua action là object thuần (tiền đã `toVnd`).

# 6. State Management
- **Server state:** TanStack React Query v5 — dùng cho mọi dữ liệu từ server ở client (kể cả gọi Server Action).
- **Client state:** Zustand v5 (`authStore`, `cartStore`...). Store persist dùng `skipHydration` + rehydrate ở client.
- KHÔNG fetch/`setState` trong `useEffect`; dùng React Query, `useSyncExternalStore`, hoặc điều chỉnh state trong render.
- KHÔNG dùng Redux, KHÔNG đồng bộ state bằng `window` event tự chế.

# 7. Styling & UI Components
- **Tailwind CSS v4** — KHÔNG dùng v3 syntax. Import qua `@tailwindcss/postcss`.
- **shadcn/ui** (style: base-vega) — Thêm component mới qua CLI. Config tại `components.json`.
- **Base UI (@base-ui/react)** — className dạng hàm dùng `resolveClassName()`.
- `cn()` đã tích hợp `tailwind-merge`. **Icons:** lucide-react (primary) + react-icons.
- Ảnh dùng `next/image` (nguồn mới thêm vào `images.remotePatterns` trong `next.config.ts`).
- Tiền hiển thị bằng `formatVnd()` từ `@repo/shared`.
- Path alias: `@/*` → `./src/*`.

# 8. Forms & Validation
- React Hook Form + Zod v4 (qua `@hookform/resolvers`).
- Dùng validator từ `@repo/shared` (`VIETNAM_PHONE_REGEX`, `newPasswordSchema`...) để khớp tuyệt đối với backend. Trong event handler đọc giá trị bằng `getValues()` (không dùng `watch()`).

# 9. Message & i18n (Đa ngôn ngữ)
- Không viết cứng text trong toast / lỗi form / state — dùng `t(...)`. Fallback của `notifyError` phải là mã KEY hoặc câu đã dịch.
- Thư viện: next-intl v4. Locales: `vi` (mặc định), `en` — hai locale phải có cùng tập key.
- File dịch nằm trong `messages/vi/` và `messages/en/`; `errors.json` chứa toàn bộ mã lỗi backend/Server Action.
- Config: `src/i18n/request.ts` và `src/i18n/routing.ts`.

# 10. Animations
- **Motion 12** (import từ `motion/react`), **Lenis** (smooth scroll, tắt ở admin), **OGL** (WebGL), **Lottie** (`@lottiefiles/dotlottie-react`).

# 11. Scripts & Lệnh
- `pnpm --filter @repo/web dev` — Chạy Next.js dev server.
- `pnpm --filter @repo/web typecheck` / `lint` — Kiểm tra type / ESLint (phải 0 lỗi, 0 cảnh báo).
- `pnpm --filter @repo/web build` — Build production.
