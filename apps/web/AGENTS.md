# ==========================================
# FRONTEND WEB — WORKSPACE RULES (@repo/web)
# ==========================================

> Quy chuẩn chi tiết: [`docs/PROJECT_RULES.md`](../../docs/PROJECT_RULES.md) — §7 Frontend, §8 Admin, §10 i18n.

# 1. Cảnh báo: Next.js 16 + React 19
- Dự án dùng Next.js 16.2 (App Router) + React 19.2.
- PHẢI đọc docs tại `node_modules/next/dist/docs/` trước khi viết code liên quan Next.js (middleware giờ là `src/proxy.ts`, chạy Node runtime).
- Mặc định sử dụng React Server Components (RSC). Chỉ thêm `"use client"` khi thực sự cần.

# 2. Kiến trúc: Feature-Based
- Mỗi feature nằm trong `src/features/<tên-feature>/`, chỉ tạo thư mục khi cần: `api/` (gọi Express), `components/`, `constants/` (cấu hình UI cố định), `data/` (**chỉ** mock tạm thời), `hooks/`, `store/`, `types/`, `utils/`, `validations/` và `index.ts` — barrel DUY NHẤT của feature.
- `components/` được chia thư mục con kebab-case theo màn con (`login/`, `detail/`, `manage-address/`), KHÔNG lồng `components/` bên trong, KHÔNG barrel con.
- Tầng dưới (`hooks`, `utils`, `constants`, `data`, `types`) KHÔNG import ngược từ `components/`.
- Features hiện tại: about, admin, auth, bespoke, cart, chat, checkout, contact, faqs, home, news, newsletter, notifications, products, profile, terms, upload, wishlist.
- Ranh giới import: `lib/` và `components/{ui,shared,effects,feedback}` KHÔNG import từ `features/` (chỉ `components/layout` được); import chéo feature qua `index`, trong cùng feature dùng đường dẫn tương đối.
- Component: `components/ui` (CHỈ shadcn sinh từ CLI), `components/effects` (animation từ registry), `components/shared` (dùng lại ở ≥ 2 feature), `components/layout` (header, footer, Container, Breadcrumbs), `components/feedback` (NotFoundView, ForbiddenView), `components/providers`. Component chỉ một màn dùng đặt trong feature đó.
- `app/` chỉ chứa route/layout/loading/not-found — không đặt component hay tài liệu ở đây.
- Utilities dùng chung: `src/lib/` (`api-client` — HTTP, `messages` — trích xuất/dịch/toast message, `utils` — `cn`, `resolveClassName`, `input-mask`, `catalog`, `jwt.server`). Hook dùng chung: `src/hooks/` (`useNotify`, `useLocalStorageBoolean`, `useHasBottomBar`).
- Barrel `index.ts` chỉ tree-shake được nhờ `"sideEffects"` trong `package.json` — module có lệnh chạy ở cấp module phải thêm vào danh sách đó. Phần nặng chỉ dùng khi thao tác (khung chat, bảng tìm kiếm, mock data) tải bằng `next/dynamic` / `import()`.

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
- Cấu trúc: `features/admin/core/{auth,server,session,layout,ui}` (khung dùng chung) + `features/admin/modules/<module>/{actions,queries,schemas,components,types}` (nghiệp vụ). Mỗi core/module có MỘT `index.ts`; không có barrel tổng `features/admin/index.ts`.
- Phân quyền: một nguồn duy nhất `features/admin/core/session/permissions.ts` (`ADMIN_MODULE_ACCESS`, `ADMIN_ACTION_ACCESS`, `canAccess`) dùng chung cho menu, page, action và UI.
- Giao diện: mọi trang dùng `AdminPage` + `AdminPageHeader` (`features/admin/core/ui`); quy chuẩn token tại `docs/guides/admin-ui.md`. Layout gắn class `admin-shell` (font Inter, reset kiểu chữ storefront).
- `queries/` CHỈ đọc Prisma (dùng ở Server Component); `actions/` CHỈ Server Action (`"use server"`); hàm client gọi Express để trong `api/`.
- Mọi Server Action: `authorizeAdminAction({ role?, permission? })` ở dòng đầu → `parseActionInput(schema, input)` (`core/server/actionInput.ts`, schema ở `schemas/<module>.schemas.ts`, KHÔNG export qua index). Mọi page đọc DB gọi `requireAdminPage()`.
- Người thực hiện lấy từ `auth.user.id` — không có trong kiểu tham số. Không trả `error.message` nội bộ — `error` luôn là mã KEY, client hiển thị qua `useNotify()`.
- Dữ liệu trả qua query/action là object thuần (tiền đã `toVnd`, không `Decimal`).
- Text admin qua i18n `AdminPage.<module>.*` (page dùng `getTranslations("AdminPage.pages.<module>")`).

# 6. State Management
- **Server state:** TanStack React Query v5 — dùng cho mọi dữ liệu từ server ở client (kể cả gọi Server Action).
- **Client state:** Zustand v5 (`authStore`, `cartStore`...). Store persist dùng `skipHydration` + rehydrate ở client.
- KHÔNG fetch/`setState` trong `useEffect`; dùng React Query, `useSyncExternalStore`, hoặc điều chỉnh state trong render.
- KHÔNG dùng Redux, KHÔNG đồng bộ state bằng `window` event tự chế.

# 7. Styling & UI Components
- **Tailwind CSS v4** — KHÔNG dùng v3 syntax. Import qua `@tailwindcss/postcss`.
- **Màu storefront:** dùng token trong `src/app/globals.css` (`text-(--danger)`, `bg-(--bg-wine)/80`, `text-primary-ink`...), KHÔNG viết class hex — cần màu mới thì thêm token ở `:root`. Chữ thương hiệu dùng `--primary-ink`, nền/viền thương hiệu dùng `--primary-color`. Admin luôn sáng, màu theo `docs/guides/admin-ui.md`.
- **Khung & lề trang storefront:** dùng `Container` (`components/layout/Container`, prop `spacing` = `page` | `section` | `none`, `width` = `default` | `narrow`) hoặc `containerClassName()` cho motion/Reveal/phần tử cần `ref`. KHÔNG tự viết `max-w-[1440px] px-5 sm:px-8…`; giá trị lề/khoảng cách dọc chỉnh tại token `--page-max-width`, `--page-gutter`, `--page-y`, `--section-y` (mục 1b `globals.css`). Phần tử tràn mép dùng `-mx-(--page-gutter)`.
- **Nút hành động storefront:** dùng `ActionButton` (`components/shared`) với `variant` = `confirm` | `dialog` | `cancel` | `disabled` | `custom` (+ `colors` để đổi màu, `loading`, `icon`, `size`); link chuyển trang dùng `ActionLink`. Màu mặc định cấu hình tại `VARIANT_COLORS` trong `ActionButton.tsx`. Server Component import trực tiếp `@/components/shared/ActionButton` (barrel `components/shared/index.ts` chứa component client).
- **Ô nhập storefront:** dùng `TextField` (`components/shared/TextField`) — mặc định kiểu gạch chân như màn Liên hệ; có `label`, `prefix`/`suffix`, `clearable`, `passwordToggle`, `copyable`, `loading`, `helperText`/`error`/`success`, `showCount`, `layout`, `appearance`, `mask` (currency/phone/card/date), `debounceMs`. Hàm mask thuần ở `lib/input-mask.ts`.
- **shadcn/ui** (style: base-vega) — Thêm component mới qua CLI. Config tại `components.json`.
- **Base UI (@base-ui/react)** — className dạng hàm dùng `resolveClassName()`.
- `cn()` đã tích hợp `tailwind-merge`. **Icons:** lucide-react (primary) + react-icons.
- Ảnh dùng `next/image` (nguồn mới thêm vào `images.remotePatterns` trong `next.config.ts`).
- Tiền hiển thị bằng `formatVnd(amount, locale)` từ `@repo/shared` — không tự ghép `toLocaleString() + "₫"`.
- Path alias: `@/*` → `./src/*`.

# 8. Forms & Validation
- React Hook Form + Zod v4 (qua `@hookform/resolvers`).
- Dùng validator từ `@repo/shared/validation` (`VIETNAM_PHONE_REGEX`, `newPasswordSchema`...) để khớp tuyệt đối với backend. Trong event handler đọc giá trị bằng `getValues()` (không dùng `watch()`).

# 9. Message & i18n (Đa ngôn ngữ)
- Không viết cứng text (toast, lỗi form, placeholder, title, nhãn trạng thái — cả storefront lẫn admin) — dùng `t(...)`. Số đếm bản tiếng Anh dùng ICU plural. Fallback của `notifyError` phải là mã KEY hoặc câu đã dịch.
- Thư viện: next-intl v4. Locales: `vi` (mặc định), `en` — hai locale phải có cùng tập key.
- File dịch nằm trong `messages/vi/` và `messages/en/`; `errors.json` chứa toàn bộ mã lỗi backend/Server Action.
- Config: `src/i18n/request.ts` và `src/i18n/routing.ts`.
- Bản dịch xuống client: root layout truyền `messages={{}}`; mỗi route group / page bọc `<ClientMessages namespaces={CLIENT_NAMESPACES.x}>` (`src/i18n/ClientMessages.tsx`). Provider lồng nhau THAY THẾ messages của cha. Client component dùng namespace mới → thêm vào `CLIENT_NAMESPACES`, nếu không sẽ hiện nguyên tên key.

# 10. Animations
- **Motion 12** (import từ `motion/react`), **Lenis** (smooth scroll, tắt ở admin), **embla-carousel** (carousel).

# 11. Scripts & Lệnh
- `pnpm --filter @repo/web dev` — Chạy Next.js dev server.
- `pnpm --filter @repo/web typecheck` / `lint` — Kiểm tra type / ESLint (phải 0 lỗi, 0 cảnh báo).
- `pnpm --filter @repo/web build` — Build production.
