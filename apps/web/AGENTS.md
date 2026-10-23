# Rule agent — `apps/web` (Next.js 16)

Bản rút gọn cho agent. Quy chuẩn đầy đủ: [`AGENTS.md`](../../AGENTS.md) gốc — §7 Frontend, §8 Admin (gồm giao diện), §10 i18n.

- ⚠️ Next.js 16 có thay đổi phá vỡ — đọc `node_modules/next/dist/docs/` trước khi viết code Next.js. Middleware là `src/proxy.ts`.
- `app/` chỉ chứa route/layout; nghiệp vụ ở `features/<feature>/` (một barrel `index.ts`, tầng dưới không import `components/`). Dùng skill `new-storefront-feature` / `new-admin-module`.
- Ranh giới import do ESLint cưỡng chế: `lib/`, `hooks/`, `components/{ui,shared,effects,feedback}` không import `features/`; chéo feature qua index.
- Storefront gọi API qua `apiClient`; server state = React Query, client state = Zustand; không fetch/setState trong `useEffect`. Khách hàng dùng `authStore`, admin dùng `useAdminSession()`.
- Admin: page `requireAdminPage()`; mọi Server Action `authorizeAdminAction()` → `parseActionInput()`, người thực hiện từ `auth.user.id`, `recordAudit()` cho thao tác nhạy cảm, lỗi trả mã KEY. Quyền chỉ đọc từ `core/session/permissions.ts`.
- Màu storefront chỉ dùng token `globals.css`; admin đơn sắc theo §8. Dùng `Container`, `ActionButton`, `TextField` thay vì tự viết.
- Mọi text qua next-intl (đủ vi + en); client component dùng namespace mới → thêm vào `CLIENT_NAMESPACES`. Tiền `formatVnd`.
- Không ghi `document.cookie` cho auth, không lưu token vào `localStorage`.
