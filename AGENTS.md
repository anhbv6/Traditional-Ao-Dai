# 📐 Quy chuẩn dự án — Traditional Ao Dai

> **Nguồn quy chuẩn DUY NHẤT** cho người và AI agent (Claude Code, Cursor, Copilot, Gemini đều trỏ về đây). Cài đặt / chạy / triển khai: [`README.md`](README.md).
> `AGENTS.md` trong từng workspace chỉ là bản rút gọn cho agent, trỏ về các mục của file này — không chép lại nội dung.
> Khi có mâu thuẫn: Bảo mật (§6) › file này › thói quen cá nhân. Quy chuẩn đổi → sửa file này trong cùng commit.

> ⚠️ **Next.js 16 khác dữ liệu huấn luyện của bạn** — API, quy ước và cấu trúc file đều có thay đổi phá vỡ (middleware giờ là `src/proxy.ts`). Đọc `node_modules/next/dist/docs/` trước khi viết code Next.js.

---

## 1. Dự án & kiến trúc

E-commerce Áo Dài truyền thống (có may đo theo số đo). Monorepo **pnpm**, TypeScript strict toàn bộ.

| Workspace | Vai trò |
| :--- | :--- |
| `apps/api` (`@repo/api`) | REST API — Express 4 |
| `apps/web` (`@repo/web`) | Storefront + Admin — Next.js 16 (App Router), React 19 |
| `packages/db` (`@repo/db`) | Prisma schema, migration, seed, Prisma Client singleton |
| `packages/shared` (`@repo/shared`) | Hợp đồng FE ↔ BE (xem §4) |
| `packages/config` (`@repo/config`) | ESLint / tsconfig / Prettier dùng chung — chỉ devDependency |

| Khu vực | Truy cập dữ liệu |
| :--- | :--- |
| **Storefront** | Gọi Express qua `apiClient` (`/api/*`) — API có Swagger, rate-limit, dùng lại cho mobile |
| **Admin** | Server Components + Server Actions gọi **Prisma trực tiếp** — KHÔNG tạo `/api/admin/*` |
| **Auth admin** (đăng nhập/đăng xuất), upload ảnh | Vẫn qua Express — một nơi cấp token & quản lý phiên |

**Cùng origin (bắt buộc):** trình duyệt chỉ gọi `/api/*` trên domain web, `next.config.ts` rewrites sang Express (`API_INTERNAL_URL`). Nhờ vậy cookie httpOnly dùng chung, không cần CORS. Không cho FE gọi thẳng cổng API.

## 2. Môi trường, lệnh & công cụ

- Node ≥ 22.18 (các package export thẳng `.ts`, chạy nhờ type-stripping). **Chỉ pnpm 11** (ghim bằng `packageManager`) — CẤM `npm install` / `yarn`. Thêm package: `pnpm --filter @repo/<ws> add <pkg>` (`-D` cho dev).
- Lệnh: xem [`README.md`](README.md) §4. `pnpm check` (typecheck + lint, 0 lỗi / 0 cảnh báo) **bắt buộc xanh trước khi commit**.
- **Env:** giá trị local nằm ở `.env.local` (gitignored; API và `packages/db` nạp `.env.local` rồi `.env`, Next.js tự nạp). Không commit `.env*` trừ `.env.example`. Biến mới: thêm vào `.env.example` đúng nhóm với ghi chú `[BẮT BUỘC]` / `[TÙY CHỌN]` + cách lấy; biến API khai báo thêm ở `apps/api/src/config/env.ts` (Zod). Không đặt bí mật vào `NEXT_PUBLIC_*`; private key JWT chỉ ở API, web chỉ có public key (+ `DATABASE_URL` cho admin).
- **Cấu hình dùng chung** (`packages/config`): ESLint `nodeConfig()` (api, db, shared) và `sharedTsRules` (web) — cấm `any`, biến `_xxx` được bỏ qua, bắt buộc `import type`, `eqeqeq`; tsconfig `base` / `node` (CommonJS: api, db) / `bundler` (ESM: web, shared); Prettier (web nháy kép + `;`, còn lại nháy đơn không `;`, `printWidth` 120). `.editorconfig` + `.gitattributes` giữ LF. Workspace mới: devDependency `@repo/config` + `eslint`, `eslint.config.mjs` gọi `nodeConfig()`, `tsconfig.json` extends một file trên.
- **Lỗi terminal:** tự đọc log, sửa và chạy lại tối đa 2 lần trước khi hỏi người dùng.

## 3. Quy ước code chung

- **Ngôn ngữ:** comment, tài liệu, commit — Tiếng Việt. Tên biến/hàm/file — Tiếng Anh.
- **Đặt tên:** `camelCase` biến/hàm, `PascalCase` component/type, `UPPER_SNAKE_CASE` hằng số và **mã KEY**. Thư mục con `kebab-case`.
  - BE: `<module>.routes|controller|service|schema|types.ts`, tiện ích `camelCase.ts`.
  - FE: component `PascalCase.tsx`, hook `useXxx.ts`, API `xxx.api.ts`, store `xxxStore.ts`, Server Action `xxx.actions.ts` (chỉ file `"use server"`), query `xxx.queries.ts` (chỉ đọc Prisma), schema action `xxx.schemas.ts`, file chỉ chạy server `*.server.ts`.
- **TypeScript:** strict, **không `any`** (dùng `unknown` + type guard, kiểu Prisma, generic). Ngoại lệ ghi lý do: `// eslint-disable-next-line <rule> -- <lý do>`. `catch (error)` không annotate; lấy message bằng `error instanceof Error`.
- **Comment** giải thích *tại sao* (quyết định, ràng buộc bảo mật, nghiệp vụ). Hàm export ở service/hook/util có JSDoc ngắn tiếng Việt.

## 4. Hợp đồng dùng chung (`@repo/shared`) & định dạng API

- Chỉ đặt thứ **cả FE và BE** cùng dùng; chỉ code thuần (không Express/Next/React/Prisma). Không `enum`/`namespace` — dùng `as const` + union. Mỗi entry **một file**, không import tương đối; entry mới khai báo cả `exports` lẫn `typesVersions`. `"sideEffects": false`.
- `@repo/shared` (**không import zod**): `LOCALES`, `pickLocalized`, `ROLES`, `PERMISSIONS`, `USER_STATUSES`, `GENDERS`, `AUTH_PROVIDERS`, `isAdminAreaRole`, `normalizeEmail`, `AUTH_COOKIES`, `TOKEN_AUDIENCES`, `AuthTokenClaims`, `UserDto`, `ApiResponse<T>`, hằng số phiên admin, `normalizeVietnamPhone`, `formatVnd`, `toVnd`.
- `@repo/shared/validation` (Zod): `vietnamPhoneSchema`, `emailSchema`, `newPasswordSchema`, `loginPasswordSchema`, `verificationCodeSchema`, regex & độ dài. Thông điệp lỗi luôn là mã KEY.
- **Response API:**
  ```jsonc
  { "status": "success", "statusCode": 200, "message": "LOGIN_SUCCESS", "data": {}, "meta": { "page": 1 } }
  { "status": "error", "statusCode": 400, "message": "VALIDATION_ERROR", "errors": [{ "field": "phone", "message": "INVALID_PHONE_NUMBER" }] }
  ```
  `message` **luôn là mã KEY**; phân trang trả `meta: { page, limit, totalItems, totalPages }`.
- **Tiền:** API/Server Action luôn trả **số nguyên VND** (`toVnd(decimal)`), không trả `Decimal` hay chuỗi đã định dạng; hiển thị bằng `formatVnd(amount, locale)`. Giá trị đơn hàng cuối cùng luôn do server tính lại.

## 5. Backend (`apps/api`)

```text
src/
├── app.ts / server.ts / routes.ts   # createApp (không listen) · listen + tắt êm · router trung tâm
├── config/                          # env.ts (Zod), swagger.ts
├── infra/                           # redis, cloudinary, mailer, sms
├── core/{http,middlewares,security,utils}/
└── modules/<module>/                # auth (client|admin), otp, user, upload
    ├── <module>.routes.ts           # endpoint + Swagger JSDoc @openapi (liệt kê mã lỗi theo status)
    ├── <module>.controller.ts       # mỏng: req -> service -> sendSuccess / next(error)
    ├── <module>.service.ts          # nghiệp vụ + Prisma
    ├── <module>.schema.ts           # Zod { body, query, params }
    └── KEYS.md                      # danh sách mã phản hồi/lỗi của module
```

- Phụ thuộc một chiều: `modules` → `core` / `infra` / `config`; `core` → `infra` / `config`. Import Prisma từ `@repo/db` (không `@prisma/client`). Đăng ký router ở `src/routes.ts`. Chỉ dùng Express (không Nest/Fastify).
- Thứ tự middleware: `validate(schema)` → `rateLimit(...)` → `requireAuth` → `requireRoles([...])` → controller. Controller luôn `try/catch` + `return next(error)`.
- Lỗi nghiệp vụ `throw new AppError(status, 'MA_KEY')`; thành công `sendSuccess(res, { data, message: 'MA_KEY' })`. Mỗi KEY mới: ghi `KEYS.md` + dịch vi/en ở `apps/web/messages/*/errors.json`. Không trả stack/thông điệp nội bộ ở production.
- **Dùng sẵn, không viết lại:** `AppError`; `rateLimit()` (middleware) / `assertRateLimit()` (service, Redis); `issueVerificationCode()` / `verifyVerificationCode()`; `set|clear{Customer,Admin}SessionCookies()` (`authCookies.ts` — nơi DUY NHẤT đặt cookie phiên); `hashToken()`, `cleanupUserSessions()`, `revokeAllUserSessions()`, `isSessionUsable()`; `sendVerificationCodeEmail()`; `toUserDto()` (`modules/user/user.mapper.ts` — trả người dùng ra ngoài luôn qua đây).
- Vận hành: `helmet`, body tối đa 100kb, `requestLogger` (không log body/header), `/api/health` kiểm tra DB + Redis, Swagger `/api-docs` chỉ ngoài production. Không log mật khẩu/token/OTP (riêng mock SMS/email ở dev). Production chạy `tsx src/server.ts` (không `node dist`).

## 6. Xác thực & bảo mật

**Một tài khoản, hai khu.** Mọi vai trò (CUSTOMER, STAFF, ADMIN) đăng nhập storefront để mua hàng; chỉ STAFF/ADMIN vào được khu quản trị. Hai khu có phiên độc lập (`UserSession.kind` = `STORE` | `ADMIN`), token ghi khu cấp trong claim `aud` (`store` | `admin`) — token khu này bị từ chối ở khu kia.

| | Storefront (`aud=store`) | Khu quản trị (`aud=admin`) |
| :--- | :--- | :--- |
| Đăng nhập | Email/SĐT + mật khẩu, OTP SĐT đã xác minh, Google. Đăng ký bằng email hoặc SĐT **bắt buộc nhập mã xác minh** | **Chỉ** email + mật khẩu. Không đăng ký/OTP/Google — tài khoản nhân viên do ADMIN tạo |
| Access token | JWT RS256 15 phút, **chỉ trong bộ nhớ** (`authStore`), header `Bearer` — kiểm tra stateless | JWT RS256 1/7 ngày, cookie httpOnly `admin_token`, `SameSite=Strict` — kiểm tra phiên DB mỗi request |
| Làm mới | Cookie httpOnly `refreshToken`: xoay vòng khi "ghi nhớ", ân hạn 30s cho nhiều tab, dùng lại token cũ → thu hồi cả họ (`familyId`) | Không refresh; hết hạn khi nhàn rỗi > 8 giờ (`lastUsedAt`) |
| Cờ UI | `has_session=1` (không bí mật) | `admin_session=<ROLE>` (chỉ hiển thị, **không dùng phân quyền**) |
| Thu hồi | Khóa / đổi mật khẩu có hiệu lực chậm nhất khi access token hết hạn | Có hiệu lực ngay |
| Quên mật khẩu | Luồng storefront cho **mọi vai trò**; đặt lại → xóa mọi phiên ở cả hai khu | ADMIN đặt lại mật khẩu nhân viên ở màn Nhân sự |

**Quy tắc bắt buộc**
1. Cookie auth **chỉ do Backend đặt/xóa**. Client không ghi `document.cookie` cho auth, không lưu token/thông tin người dùng vào `localStorage`.
2. `requireAuth` (endpoint storefront) chỉ đọc Bearer, chỉ nhận `aud=store`. `requireAnyAuth` (endpoint dùng chung như upload) nhận thêm cookie `admin_token`. Không thêm cookie auth nào khác.
3. **Mọi Server Action admin:** dòng đầu `authorizeAdminAction({ role?, permission? })`, rồi `parseActionInput(schema, input)` — Server Action là endpoint công khai. **Mọi page admin đọc DB** gọi `requireAdminPage()`.
4. **Không tin định danh từ client:** người thực hiện (`requestedById`, `reviewedById`, `actorId`...) luôn lấy từ phiên server và không có trong kiểu tham số action.
5. Không trả `error.message` nội bộ (Prisma, thư viện) — log server, trả mã KEY.
6. Mã xác minh: tối đa 5 lần sai/mã (đếm trước khi so sánh), so sánh constant-time, dùng một lần. Mọi endpoint gửi mã / đăng nhập / kiểm tra tài khoản có rate-limit.
7. Không để lộ tài khoản tồn tại hay không (`INVALID_CREDENTIALS`; quên mật khẩu luôn trả thành công; đăng nhập admin bằng tài khoản CUSTOMER cũng `INVALID_CREDENTIALS`).
8. Đổi email/SĐT phải qua mã xác minh. Chỉ SĐT **đã xác minh** dùng được cho OTP / đặt lại mật khẩu. Email luôn lưu chữ thường (`normalizeEmail`).
9. Google: tra `SocialAccount(GOOGLE, sub)` trước; chỉ tự liên kết qua email khi email tài khoản **đã xác minh**, ngược lại `GOOGLE_EMAIL_ACCOUNT_UNVERIFIED`.
10. `proxy.ts` chỉ chặn sớm (xác minh chữ ký) — kiểm tra quyền thật ở Server Action / page / Express.
11. Production phải có reverse proxy đặt `X-Forwarded-For` đúng + `TRUST_PROXY` tương ứng (rate-limit theo IP, IP trong `AuditLog` phụ thuộc vào đây).

## 7. Frontend (`apps/web`)

```text
src/
├── app/[locale]/(store|auth|admin)/   # CHỈ route/layout/loading — page chỉ lắp ráp feature
├── components/
│   ├── ui/          # CHỈ shadcn sinh từ CLI (style base-vega)
│   ├── effects/     # animation từ registry (ClickSpark, Counter, FallingPetals...)
│   ├── shared/      # dùng ở ≥ 2 feature: ActionButton/ActionLink, TextField, AppDialog, OtpInput...
│   ├── layout/      # header, footer, Container, Breadcrumbs (được dùng feature qua index)
│   ├── feedback/    # NotFoundView, ForbiddenView
│   └── providers/   # AppProviders (React Query, khôi phục phiên, giỏ hàng)
├── features/<feature>/   # api, components, constants, data (mock tạm), hooks, store, types, utils, validations, index.ts
├── hooks/  i18n/  lib/   # lib: api-client, messages, utils (cn, resolveClassName), input-mask, jwt.server
└── proxy.ts              # i18n + chặn sớm /admin, /profile
```

- **Feature:** `index.ts` là barrel DUY NHẤT; `components/` chia thư mục con kebab-case theo màn, không lồng `components/`, không barrel con. Phụ thuộc một chiều `components` → `hooks/store/api` → `utils/constants/data/types` (tầng dưới không import `components/`). Trong feature dùng đường dẫn tương đối, giữa feature dùng `@/features/<x>`.
- **Ranh giới import (ESLint cưỡng chế):** `lib/`, `hooks/`, `components/{ui,shared,effects,feedback}` không import `features/` (chỉ `components/layout|providers` được). Import chéo feature qua index (ngoại lệ: `*.server.ts`, `features/admin/core/server/*`, `features/admin/core/session/permissions`). Tránh cả import tương đối chéo feature (ESLint chưa bắt được).
- **Tree-shaking:** barrel chỉ tree-shake nhờ `"sideEffects"` trong `apps/web/package.json` — module có lệnh chạy cấp module phải thêm vào. Phần nặng chỉ dùng khi thao tác (chat, tìm kiếm, mock) tải bằng `next/dynamic` / `import()`. Provider bên thứ ba (Google) đặt tại component cần nó.
- **Server/Client:** mặc định Server Component; `"use client"` chỉ khi cần state/effect/event/API trình duyệt. Trang SEO lấy dữ liệu ở Server Component.
- **State:** server state = React Query (key dạng mảng); client state dùng chung = Zustand (persist dùng `skipHydration`); form = React Hook Form + Zod (validator từ `@repo/shared/validation`, đọc giá trị bằng `getValues()`). **Không** fetch/setState đồng bộ trong `useEffect` (dùng React Query, `useSyncExternalStore`, hoặc điều chỉnh state trong render); không đồng bộ state bằng window event tự chế.
- **Gọi API:** luôn qua `apiClient` với `/api/...`. Khách hàng: `authStore` (token trong bộ nhớ), đăng nhập xong `establishCustomerSession()`, đăng xuất `useCustomerLogout()`. Admin: `useAdminSession()` (đọc từ server), không dùng `authStore`.
- **Message:** mọi xử lý ở `@/lib/messages` (`extractErrorMessage`, `translateMessage`, `notifyError`, `notifySuccess`) hoặc `useNotify()`. Fallback phải là mã KEY hoặc câu đã dịch. Không viết cứng text trong toast/lỗi form.
- **Giao diện storefront:** Tailwind v4 (không cú pháp v3), `cn()`, `resolveClassName()` cho className dạng hàm của Base UI. **Màu chỉ dùng token** trong `globals.css` (`text-(--danger)`, `bg-(--bg-wine)/80`...) — cần màu mới thì thêm token. Khung trang dùng `Container` / `containerClassName()` (token `--page-*`, `--section-y`), không tự viết `max-w-... px-...`. Nút: `ActionButton` (`variant` confirm/dialog/cancel/disabled/custom) / `ActionLink`; ô nhập: `TextField`. Ảnh `next/image` (nguồn mới thêm `images.remotePatterns`; URL tùy ý như blob/avatar dùng `<img>` kèm comment lý do). Icon lucide-react. Animation Motion 12 (`motion/react`), Lenis (tắt ở admin), embla-carousel.

## 8. Khu quản trị (Admin)

```text
features/admin/
├── core/{auth,server,session,layout,ui}/   # đăng nhập · adminAuth.server, audit.server, actionInput · permissions, useAdminSession · khung · AdminPage...
└── modules/<module>/                       # approvals, cms, customers, dashboard, inventory, orders, products, staff, tailoring, vouchers
    ├── actions/<m>.actions.ts   # "use server" — mutation + đọc cho client component
    ├── queries/<m>.queries.ts   # CHỈ đọc Prisma
    ├── schemas/<m>.schemas.ts   # Zod tham số action — KHÔNG export qua index
    ├── components/ types/ utils/ hooks/
    └── index.ts                 # barrel duy nhất (không có barrel tổng features/admin/index.ts)
```

**Phân quyền** — nguồn duy nhất `core/session/permissions.ts` (`ADMIN_MODULE_ACCESS`, `ADMIN_ACTION_ACCESS`, `canAccess`), dùng chung cho menu, page, action và nút UI. ADMIN có toàn quyền; STAFF chỉ có quyền trong `User.permissions` (mặc định rỗng).

| Module | STAFF cần quyền | Ghi chú |
| :--- | :--- | :--- |
| Dashboard | — | Mỗi khối theo quyền: doanh thu = `VIEW_REPORTS`, tồn kho = `MANAGE_INVENTORY`, may đo = `UPDATE_TAILORING`, đơn mới = `MANAGE_ORDERS` |
| Đơn hàng · Khách hàng | `MANAGE_ORDERS` | Hủy đơn / hoàn tiền / giảm giá tay phải gửi **yêu cầu phê duyệt**. Khóa/mở khách hàng chỉ ADMIN |
| Xưởng may đo | `UPDATE_TAILORING` | Người thực hiện ghi vào `TailoringLog` |
| Sản phẩm · Tồn kho | `MANAGE_INVENTORY` | |
| Nội dung & FAQ | `MANAGE_CONTENT` | |
| Phê duyệt | — | STAFF chỉ thấy yêu cầu của mình; duyệt/từ chối chỉ ADMIN (duyệt xong hệ thống tự thực thi) |
| Nhân sự · Voucher | ✗ (chỉ ADMIN) | Tạo nhân viên, cấp quyền, khóa/mở, đặt lại mật khẩu |

**Quy tắc**
- Page: `await requireAdminPage(ADMIN_MODULE_ACCESS.<module>)` → `getTranslations("AdminPage.pages.<module>")` → query. Giao diện luôn `AdminPage` + `AdminPageHeader`.
- Server Action:
  ```ts
  "use server";
  export async function updateSomethingAction(raw: z.input<typeof updateSomethingSchema>) {
    const auth = await authorizeAdminAction({ permission: "MANAGE_ORDERS" }); // hoặc { role: "ADMIN" }
    if (!auth.success) return auth;
    const input = parseActionInput(updateSomethingSchema, raw);
    if (!input.success) return input;
    try {
      // Prisma, người thực hiện = auth.user.id
      await recordAudit({ actorId: auth.user.id, action: "SOMETHING_UPDATED", targetType: "ORDER", targetId }); // thao tác nhạy cảm
      revalidatePath("/admin/<module>");
      return { success: true, data };
    } catch (error) {
      console.error("Lỗi updateSomethingAction:", error);
      return { success: false, error: "SOMETHING_UPDATE_FAILED" };
    }
  }
  ```
- Kết quả action luôn `{ success: true, data } | { success: false, error: "MA_KEY" }`; client hiện lỗi bằng `useNotify().error(res.error, "FALLBACK_KEY")`. Dữ liệu trả về là object thuần (tiền `toVnd`, không trường nhạy cảm). Client component gọi action qua React Query. `PermissionGate` / ẩn nút chỉ là UI.
- Thao tác nhạy cảm (nhân sự, khóa tài khoản, duyệt yêu cầu) ghi `AuditLog` qua `recordAudit()` sau khi thành công.
- Text admin qua i18n `AdminPage.<module>.*`; nhãn trạng thái dịch theo mã (`t(\`status.${status}\`)`).

**Giao diện admin** — tông đơn sắc, luôn sáng, **không** dùng màu thương hiệu Burgundy của storefront, không breadcrumb / `Container` storefront.
- Font Inter (`--font-admin`); layout và mọi portal (Dialog, Dropdown) gắn class `admin-shell` (reset kiểu chữ storefront).
- Màu: nền trang `#FAFAFA`, card `bg-white`, chữ chính `#09090B`, chữ phụ `#71717A`, viền `#E4E4E7`, nút chính `bg-[#18181B] hover:bg-[#09090B]`. Màu ngữ nghĩa chỉ cho trạng thái: `emerald` = thành công/hoạt động, `amber` = chờ/cảnh báo, `rose` = lỗi/khóa/hết hàng.
- Thành phần (`core/ui`): `AdminPage` (khung trang), `AdminPageHeader` (icon + eyebrow, tiêu đề `text-2xl font-semibold`, `meta` hoặc `actions`), `AdminMetaValue` (số liệu font mono), `AdminSegmentedControl`, `AdminSecondaryButton`, `ADMIN_CARD_CLASS` (`rounded-xl border border-[#E4E4E7] bg-white shadow-2xs` — không `rounded-2xl`).
- Chữ: tiêu đề bảng/card `text-sm font-semibold uppercase tracking-[0.5px]`; nội dung bảng `text-sm`; nhãn phụ `text-xs text-[#71717A]`; KPI `text-3xl font-bold font-mono`.

## 9. Database (`packages/db`)

**Schema** (22 model, 15 enum):
- **Người dùng & phiên:** `User` (email chữ thường — CHECK constraint; `emailVerifiedAt` / `phoneVerifiedAt`, `passwordHash`, `status` ACTIVE/LOCKED/DELETED, `permissions` của STAFF), `SocialAccount` (`provider` enum, unique `userId + provider`), `UserSession` (`kind` STORE/ADMIN, `refreshTokenHash` chỉ ở STORE, `familyId`, `lastUsedAt`), `UserAddress`, `UserMeasurement`.
- **Catalog & bán hàng:** `Category`, `Product`, `ProductVariant`, `Cart`, `CartItem`, `Voucher`, `Order` (`paidAmount`, `dueDate`), `OrderItem` (snapshot sản phẩm + số đo), `TailoringLog`, `Review`, `ReviewMedia`.
- **Vận hành:** `ApprovalRequest` (`actionType` enum, `targetId`), `AuditLog` (chỉ ghi thêm), `Article`, `Faq`, `Appointment`, `Fabric`.

**Quy ước schema**
- `id String @id @default(uuid())`; có `createdAt` + `updatedAt @updatedAt` (ngoại lệ bảng log chỉ ghi thêm). Quan hệ có khóa ngoại tường minh + `@@index` cho cột lọc/khóa ngoại; không thêm index trùng với `@unique`.
- Tiền `Decimal @db.Decimal(12, 2)`, ra ngoài bằng `toVnd()`. Snapshot giá/tên/số đo lúc mua nằm ở `OrderItem`.
- Đa ngôn ngữ: cột gốc tiếng Việt (bắt buộc) + `<field>En` (nullable), đọc bằng `pickLocalized(entity, 'name', locale)`.

**Migration:** sửa `schema.prisma` (không `prisma format` cả file) → `pnpm db:migrate --name <ten>` → `pnpm db:generate` (Windows: dừng `pnpm dev` trước). Môi trường không interactive (CI, agent): `prisma migrate diff ... --script` vào `prisma/migrations/<timestamp>_<ten>/migration.sql`, xem lại SQL (chạy thử trong `BEGIN ... ROLLBACK`), rồi `pnpm db:deploy`. **Không sửa/xóa migration đã áp dụng**; không `db push` ngoài prototype. Migration phá dữ liệu phải có bước chuyển dữ liệu.

**Seed** (`prisma/seed/`: `index.ts` cấu hình + thứ tự, `accounts.ts`, `catalog.ts`, `operations.ts`; typecheck qua `prisma/tsconfig.json`): idempotent (upsert theo khóa tự nhiên / id cố định), import Prisma từ `../../src`, không ghi đè mật khẩu tài khoản đã có, **không in mật khẩu**, dữ liệu đa ngôn ngữ điền cả cột `En`, giá biến thể `null` khi bằng `basePrice`. `SEED_DEMO_DATA=false` (production) chỉ tạo admin + danh mục và bắt buộc `SEED_ADMIN_PASSWORD`.

## 10. Đa ngôn ngữ (i18n)

- next-intl v4, `vi` (mặc định) và `en`; mọi route dưới `/[locale]`; dùng `Link`, `useRouter`, `redirect` từ `@/i18n/routing`.
- File `apps/web/messages/<locale>/<namespace>.json` — **hai locale cùng tập key**. Text giao diện (kể cả placeholder, title, aria-label, nhãn trạng thái) luôn qua key dịch. Số đếm tiếng Anh dùng ICU plural.
- `errors.json` chứa **mọi mã lỗi** BE/Server Action, được gộp vào mọi namespace. Mã thành công (`*_SUCCESS`) dịch trong `responses` của namespace màn gọi (`Auth.responses`, `ProfilePage.responses`).
- Root layout truyền `messages={{}}`; mỗi route group / page bọc `<ClientMessages namespaces={CLIENT_NAMESPACES.<khu>}>` để chỉ gửi namespace mà **Client Component** dùng (provider lồng nhau **thay thế** messages của cha). Client component dùng namespace mới → thêm vào `CLIENT_NAMESPACES`, nếu không sẽ hiện nguyên tên key.

## 11. Git, CI & công cụ AI

- Nhánh `main` (production), `develop` (tích hợp), `feat|fix|refactor|docs/<ten>`. Commit tiếng Việt, tiền tố `feat:` `fix:` `refactor:` `docs:` `chore:` `test:`.
- **CẤM** `git add .` / `-A` (add đúng file), **CẤM** tự push `main`/`master`, force push, `--no-verify`, commit `.env` / `.env.local`. Dừng sau khi commit để người dùng kiểm tra.
- CI (`.github/workflows/ci.yml`): `install → db:generate → typecheck → lint` cho PR và push `main`/`develop`.
- Thay đổi schema, env hoặc luồng auth phải ghi rõ trong mô tả PR (cách migrate, biến cần thêm, ai phải đăng nhập lại). Các bước cần làm ở Neon / Render / Vercel theo từng loại thay đổi: [`RUNBOOK.md`](RUNBOOK.md).
- **Claude Code** (`.claude/settings.json` + `.claude/hooks/`): `guard-bash.mjs` chặn các lệnh bị cấm ở trên và `npm`/`yarn`; `lint-file.mjs` lint ngay file vừa sửa; `check-on-stop.mjs` chạy `pnpm check` khi agent dừng. Cấu hình cá nhân đặt ở `.claude/settings.local.json` (gitignore).
- **Skill dự án** (`.claude/skills/`, có mẫu file từng bước): `new-api-module`, `new-admin-module`, `new-storefront-feature`, `add-message-key`.

**Checklist nhanh**
- *Endpoint BE:* Zod schema (thông điệp là mã KEY) → route `validate` → `rateLimit` → `requireAuth`/`requireRoles` → service ném `AppError`, transaction cho nhiều bảng → tiền số nguyên, không trả trường nhạy cảm → Swagger đủ mã lỗi + `KEYS.md` + bản dịch.
- *Feature storefront:* đúng khuôn §7, một barrel → `apiClient` + React Query → text qua next-intl (đủ vi/en, `CLIENT_NAMESPACES`), tiền `formatVnd`, màu qua token → phần nặng `next/dynamic`.
- *Màn admin:* đúng khuôn §8 → page `requireAdminPage()` → action `authorizeAdminAction` + `parseActionInput`, người thực hiện từ phiên, `recordAudit` cho thao tác nhạy cảm, `revalidatePath` → text `AdminPage.<module>.*`.
- *Database:* migration mới (không sửa cũ), đã xem SQL → `pnpm db:generate` → cập nhật seed nếu cần.

## 12. Giới hạn đã biết & nợ kỹ thuật

| Hạng mục | Hiện trạng | Hướng xử lý |
| :--- | :--- | :--- |
| Dữ liệu storefront | Sản phẩm, tin tức, wishlist, FAQ, lịch sử đơn... vẫn là **mock** | Xây module `products`, `orders`, `cart` ở Express theo §5; trang SEO dùng Server Component |
| Giỏ hàng | localStorage + mã giảm giá demo phía client | API giỏ hàng + gộp giỏ khách vãng lai khi đăng nhập; voucher xác thực ở server |
| Địa chỉ | Vẫn còn cấp huyện | Theo địa giới mới từ 07/2025 (tỉnh + xã/phường) |
| Test | Chưa có test tự động | Ưu tiên test tích hợp auth (supertest) và hàm tính tiền |
| Prettier | Có cấu hình nhưng chưa định dạng toàn repo nên chưa vào CI | Một commit riêng chỉ chạy `pnpm format`, rồi thêm `format:check` vào CI |
| Thông điệp Zod khi thiếu trường | Trả câu mặc định tiếng Anh thay vì mã KEY | Khai báo thông điệp `required` bằng mã KEY trong schema |
| Phiên hết hạn | Chỉ dọn khi người dùng đăng nhập lại | Job dọn định kỳ theo index `UserSession.expiresAt` |
| Action đọc dữ liệu | Một số action chỉ đọc chưa có schema | Thêm khi chạm vào file |
| Ngày giờ ở admin | Một số chỗ `toLocaleString("vi-VN")` cố định | Đổi sang `useFormatter()` của next-intl |
| Prisma generate trên Windows | `EPERM` khi dev server đang chạy | Dừng `pnpm dev` rồi generate |
