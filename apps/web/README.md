# 💻 @repo/web — Storefront + Admin

Next.js 16 (App Router) + React 19, kiến trúc **Feature-based**. Đa ngôn ngữ `vi` / `en` bằng next-intl.

## Chạy

```bash
pnpm --filter @repo/web dev   # http://localhost:3000
```

- Cần API chạy ở `API_INTERNAL_URL` (mặc định `http://127.0.0.1:3001`).
- Env: `apps/web/.env` — `DATABASE_URL` và `JWT_PUBLIC_KEY` phải trùng với `apps/api/.env`.
- Admin: `/vi/admin/login`. Thiếu `DATABASE_URL` → mọi trang admin bị đẩy về đăng nhập.

## Cấu trúc

```text
messages/{vi,en}/      # Bản dịch (errors.json = mã lỗi từ BE)
src/
├── app/[locale]/      # Routing: (store), (auth), (admin) — chỉ lắp ráp feature
├── components/        # ui (shadcn), effects, shared, layout, feedback, providers
├── features/          # Nghiệp vụ: products, cart, checkout, bespoke, auth, profile... + admin/
├── hooks/  i18n/  lib/
└── proxy.ts           # Middleware Next 16: i18n + chặn route
```

**Feature storefront** (`features/<feature>/`): `api, components, constants, data, hooks, store, types, utils, validations` — chỉ public qua `index.ts`.

**Admin** (`features/admin/`): `core/{auth,server,session,layout,ui}` + `modules/<module>/{actions,queries,schemas,components,types}`.

## Quy ước

- **Dữ liệu:** Storefront gọi Express qua `lib/api-client`; Admin dùng Server Components + Server Actions gọi Prisma trực tiếp.
- **State:** React Query cho server state, Zustand cho client state (phiên, giỏ hàng).
- **Admin:** page gọi `requireAdminPage()`; Server Action gọi `authorizeAdminAction()` rồi `parseActionInput()`.
- **Form:** React Hook Form + Zod (validator dùng chung lấy từ `@repo/shared/validation`).
- ESLint có luật ranh giới kiến trúc — không import chéo nội bộ feature.
- Skill: `new-storefront-feature`, `new-admin-module`, `add-message-key`. Chi tiết: [`AGENTS.md`](AGENTS.md), [`docs/guides/admin-ui.md`](../../docs/guides/admin-ui.md).

## Lệnh

| Lệnh | Tác dụng |
| :--- | :--- |
| `pnpm --filter @repo/web dev` | Dev server |
| `pnpm --filter @repo/web build` / `start` | Build / chạy production |
| `pnpm --filter @repo/web typecheck` / `lint` | Kiểm tra |
| `pnpm --filter @repo/web add <pkg>` | Cài package |
