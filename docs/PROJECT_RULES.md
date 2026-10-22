# 📐 Quy Chuẩn Dự Án — Traditional Ao Dai

> Tài liệu này là **nguồn quy chuẩn duy nhất** cho toàn bộ monorepo. Các file khác chỉ tóm tắt và trỏ về đây.
> Khi quy chuẩn thay đổi: sửa file này trước, sau đó cập nhật các file tóm tắt.

**Bản đồ tài liệu:**

| File | Vai trò |
| :--- | :--- |
| `docs/PROJECT_RULES.md` | Quy chuẩn đầy đủ (file này) |
| `AGENTS.md` (gốc) | Tóm tắt toàn monorepo cho người & AI agent |
| `apps/*/AGENTS.md`, `packages/*/AGENTS.md` | Tóm tắt quy tắc riêng của từng workspace |
| `CLAUDE.md`, `gemini.md` (gốc + mỗi workspace) | Chỉ `@AGENTS.md` — để Claude Code / Gemini tự nạp đúng `AGENTS.md` theo thư mục đang làm việc |
| `.cursor/rules/main.mdc`, `.github/copilot-instructions.md` | Chỉ trỏ về các file trên (không chép lại nội dung) |
| `docs/guides/` | Hướng dẫn chuyên đề: `admin-ui.md` (giao diện admin), `jwt-keys.md` (tạo cặp khóa JWT), `deploy.md` (triển khai Vercel/Render/Neon/Upstash) |
| `.claude/skills/` | Skill dự án: quy trình từng bước + mẫu file khi tạo module/feature/mã KEY mới |
| `.claude/settings.json`, `.claude/hooks/` | Quyền lệnh + hook cưỡng chế quy tắc cho Claude Code (xem §11) |
| `packages/config/` | Cấu hình công cụ dùng chung: ESLint, tsconfig, Prettier (xem §2) |
| `README.md` | Giới thiệu, cài đặt, chạy dự án |

**Thứ tự ưu tiên khi có mâu thuẫn:** Bảo mật (§6) › File này › `AGENTS.md` của workspace › `AGENTS.md` ở root › thói quen cá nhân.

---

## Mục lục

1. [Kiến trúc tổng thể](#1-kiến-trúc-tổng-thể)
2. [Môi trường & công cụ](#2-môi-trường--công-cụ)
3. [Quy ước chung cho code](#3-quy-ước-chung-cho-code)
4. [Hợp đồng dữ liệu dùng chung (`@repo/shared`)](#4-hợp-đồng-dữ-liệu-dùng-chung-reposhared)
5. [Backend (`apps/api`)](#5-backend-appsapi)
6. [Xác thực & bảo mật](#6-xác-thực--bảo-mật)
7. [Frontend (`apps/web`)](#7-frontend-appsweb)
8. [Khu vực quản trị (Admin)](#8-khu-vực-quản-trị-admin)
9. [Database (`packages/db`)](#9-database-packagesdb)
10. [Đa ngôn ngữ (i18n)](#10-đa-ngôn-ngữ-i18n)
11. [Git, kiểm tra chất lượng & CI](#11-git-kiểm-tra-chất-lượng--ci)
12. [Checklist khi thêm tính năng](#12-checklist-khi-thêm-tính-năng)
13. [Giới hạn đã biết & nợ kỹ thuật](#13-giới-hạn-đã-biết--nợ-kỹ-thuật)

---

## 1. Kiến trúc tổng thể

```text
                         ┌──────────────────────── apps/web (Next.js 16) ────────────────────────┐
Trình duyệt ── /vi/... ─►│ proxy.ts (i18n + chặn route)  →  Server/Client Components             │
            ── /api/... ►│ rewrites /api/* ───────────────────────────────┐                        │
                         │                                                │  Admin: Server Actions │
                         └────────────────────────────────────────────────┼──────────┬────────────┘
                                                                          ▼          │
                                         apps/api (Express) ── Prisma ──► PostgreSQL ◄┘ (Prisma trực tiếp)
                                                │
                                                └── ioredis ──► Redis (OTP, rate-limit, reset token)
```

| Khu vực | Cách truy cập dữ liệu | Lý do |
| :--- | :--- | :--- |
| **Storefront** (khách hàng) | Gọi **Express API** qua `apiClient` (`/api/*`, cùng origin) | API có Swagger, rate-limit, dùng lại cho mobile sau này |
| **Admin** (ADMIN/STAFF) | **Server Components + Server Actions gọi Prisma trực tiếp** — KHÔNG tạo endpoint `/api/admin/*` | Quyết định kiến trúc của dự án: admin chỉ chạy trên web nội bộ, giảm lớp trung gian |
| **Auth admin** (đăng nhập/đăng xuất, upload ảnh) | Vẫn qua Express (`/api/auth/admin/*`, `/api/upload`) | Một nơi duy nhất cấp token & quản lý phiên |

**Các package workspace:**

| Package | Vai trò |
| :--- | :--- |
| `@repo/api` | REST API (Express 4) |
| `@repo/web` | Storefront + Admin (Next.js 16, React 19) |
| `@repo/db` | Prisma schema, migration, Prisma Client singleton |
| `@repo/shared` | Hợp đồng dữ liệu dùng chung FE/BE: validator Zod, kiểu response, mã cookie, tiền tệ, locale |
| `@repo/config` | Cấu hình công cụ dùng chung (ESLint, tsconfig, Prettier) — chỉ là devDependency, không chạy ở runtime |

**Cùng origin (bắt buộc):** trình duyệt luôn gọi `/api/*` trên domain của web; `next.config.ts` rewrites chuyển tiếp sang Express (`API_INTERNAL_URL`). Nhờ vậy cookie httpOnly do API đặt dùng được cho cả Next proxy/Server Actions và không cần CORS. **Không** cấu hình FE gọi thẳng cổng API.

---

## 2. Môi trường & công cụ

- **Node.js ≥ 22.18** (khuyến nghị 24). Các package workspace (`@repo/db`, `@repo/shared`) export thẳng file `.ts`; Node chạy được nhờ type-stripping mặc định.
- **pnpm 11** là package manager duy nhất (ghim bằng `packageManager` trong `package.json` gốc — CI đọc từ đây). **CẤM** `npm install` / `yarn`.
  - Thêm package: `pnpm --filter @repo/<workspace> add <pkg>` (`-D` cho devDependency).
- Docker Compose hiện chỉ chạy **Redis**; PostgreSQL tự cài (local/cloud).

### Lệnh chính (chạy ở root)

| Lệnh | Tác dụng |
| :--- | :--- |
| `pnpm dev` | Chạy dev tất cả workspace song song |
| `pnpm check` | `typecheck` + `lint` toàn repo — **bắt buộc xanh trước khi commit** |
| `pnpm typecheck` | `tsc --noEmit` cho mọi workspace |
| `pnpm lint` | ESLint cho mọi workspace (web, api, db, shared) — 0 lỗi / 0 cảnh báo |
| `pnpm format` / `pnpm format:check` | Định dạng bằng Prettier / chỉ kiểm tra (chưa bắt buộc, xem §13) |
| `pnpm build` | Build tất cả workspace |
| `pnpm db:migrate` | Tạo + áp dụng migration (dev, interactive) |
| `pnpm db:deploy` | Áp dụng migration có sẵn (production / môi trường không interactive) |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:seed` / `pnpm db:studio` | Seed dữ liệu / mở Prisma Studio |

### Cấu hình công cụ dùng chung (`packages/config`)

Mọi workspace dùng chung một nguồn cấu hình — sửa luật ở đây thay vì chép vào từng workspace.

| File | Dùng ở | Nội dung |
| :--- | :--- | :--- |
| `eslint/base.mjs` | `nodeConfig()` cho api, db, shared; `sharedTsRules` ghép vào cấu hình Next của web | `js` + `typescript-eslint` recommended, cấm `any`, biến/tham số `_xxx` được bỏ qua, bắt buộc `import type` khi chỉ dùng kiểu, `eqeqeq` |
| `tsconfig/base.json` | mọi workspace (qua `node.json` / `bundler.json`) | `strict`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`, `resolveJsonModule` |
| `tsconfig/node.json` | `apps/api`, `packages/db` | CommonJS, ES2022 |
| `tsconfig/bundler.json` | `apps/web`, `packages/shared` | ESM, `moduleResolution: bundler`, `isolatedModules`, `noEmit` |
| `prettier.config.mjs` | `prettier.config.mjs` ở gốc | Giữ phong cách hiện có: web nháy kép + chấm phẩy; api/db/shared nháy đơn, không chấm phẩy; `printWidth` 120 |

- Riêng web có thêm luật: `no-console` (chỉ cho `warn`/`error`) và **luật ranh giới kiến trúc** (§7 "Ranh giới import").
- `.editorconfig` (UTF-8, LF, 2 dấu cách) và `.gitattributes` (`eol=lf`) ở gốc — repo luôn lưu LF dù làm việc trên Windows.
- Workspace mới: thêm devDependency `"@repo/config": "workspace:*"` + `eslint`, tạo `eslint.config.mjs` gọi `nodeConfig()`, `tsconfig.json` `extends` một trong các file trên, script `lint: "eslint"`.

### Biến môi trường

- **TUYỆT ĐỐI KHÔNG commit `.env`**. Mỗi biến mới phải được thêm vào `.env.example` tương ứng kèm comment giải thích.
- Backend validate env bằng Zod tại `apps/api/src/config/env.ts` — thêm biến mới phải khai báo ở đây.

| File | Biến quan trọng |
| :--- | :--- |
| `apps/api/.env` | `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `REDIS_*`, `SMTP_*`, `CLOUDINARY_*`, `GOOGLE_CLIENT_ID`, `TRUST_PROXY`, `SEED_ADMIN_*` (tài khoản do `pnpm db:seed` tạo) |
| `apps/web/.env` | `NEXT_PUBLIC_API_URL="/api"`, `API_INTERNAL_URL`, `JWT_PUBLIC_KEY` (chỉ public key — dùng ở server để xác minh `admin_token`), `DATABASE_URL` (khu vực admin gọi Prisma trực tiếp — thiếu biến này mọi trang admin bị đẩy về đăng nhập), `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| `packages/db` | Không có `.env` riêng — đọc `apps/api/.env` qua `dotenv-cli` |

- Biến có tiền tố `NEXT_PUBLIC_` sẽ lộ ra trình duyệt → **không bao giờ** đặt bí mật vào đó. Private key JWT chỉ nằm ở `apps/api/.env`.

---

## 3. Quy ước chung cho code

### Ngôn ngữ & đặt tên
- Comment, tài liệu, commit message: **Tiếng Việt**. Tên biến/hàm/class/interface/file: **Tiếng Anh**.
- `camelCase` cho biến/hàm, `PascalCase` cho component/type/interface, `UPPER_SNAKE_CASE` cho hằng số và **mã KEY** (lỗi/phản hồi).
- Tên file:
  - BE: `<module>.routes.ts`, `.controller.ts`, `.service.ts`, `.schema.ts`, `.types.ts`; tiện ích `camelCase.ts`.
  - FE: component `PascalCase.tsx`; hook `useXxx.ts`; API `xxx.api.ts`; store `xxxStore.ts`; Server Action `xxx.actions.ts` (**chỉ** file có `"use server"`); query server `xxx.queries.ts` (**chỉ** hàm đọc Prisma); schema tham số action `xxx.schemas.ts`; file chỉ chạy server `*.server.ts`.
  - Thư mục con: `kebab-case` (`manage-address/`, `order-history/`).

### TypeScript
- `strict` ở mọi workspace. **Không dùng `any`** — dùng `unknown` + type guard, kiểu Prisma (`Prisma.XWhereInput`), generic, hoặc `Record<string, unknown>`.
- Ngoại lệ phải ghi rõ lý do ngay tại chỗ: `// eslint-disable-next-line <rule> -- <lý do>`.
- Không dùng `enum`/`namespace` trong `@repo/shared` (không tương thích type-stripping) — dùng `as const` + union type.
- `catch (error)` (không annotate `any`); lấy thông điệp bằng `error instanceof Error ? error.message : ...`.

### Comment
- Comment giải thích **tại sao** (quyết định, ràng buộc bảo mật, nghiệp vụ), không lặp lại code làm gì.
- Mỗi hàm export ở service/hook/util có JSDoc ngắn bằng tiếng Việt.

---

## 4. Hợp đồng dữ liệu dùng chung (`@repo/shared`)

**Đưa vào shared khi** một thứ được dùng ở **cả** FE và BE: validator Zod, regex, hằng số nghiệp vụ, kiểu DTO/response, tên cookie, hàm tiện ích thuần.

**Quy tắc của package:**
- Chỉ code thuần — không import Express, Next.js, React, Prisma.
- Mỗi entry là **một file** và **không import tương đối** giữa các file (Node chạy thẳng `.ts` bằng type-stripping). Entry mới khai báo trong `exports` + `typesVersions` (API dùng `module: commonjs` nên TypeScript chỉ đọc `typesVersions`).
- Entry chính `@repo/shared` **không được import zod** — trang chỉ cần hằng số (`AUTH_COOKIES`, `formatVnd`...) sẽ không phải tải zod (~98KB) xuống trình duyệt. Validator nằm ở `@repo/shared/validation`.
- `"sideEffects": false` — không viết lệnh chạy ở cấp module.
- Thông điệp lỗi Zod luôn là **mã KEY**.

**Nội dung hiện có:**

| Entry | Nhóm | Export |
| :--- | :--- | :--- |
| `@repo/shared` | Locale | `LOCALES`, `Locale`, `DEFAULT_LOCALE`, `pickLocalized()` |
| | Vai trò | `ROLES`, `Role` |
| | Response | `ApiSuccess<T>`, `ApiError`, `ApiResponse<T>`, `ApiMeta`, `ApiFieldError` |
| | Auth | `AUTH_COOKIES`, `UserDto`, `SocialAccountDto` |
| | SĐT | `normalizeVietnamPhone()` |
| | Tiền tệ | `formatVnd()`, `toVnd()` |
| `@repo/shared/validation` | Validation | `VIETNAM_PHONE_REGEX`, `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH`, `VERIFICATION_CODE_LENGTH`, `vietnamPhoneSchema`, `emailSchema`, `newPasswordSchema`, `loginPasswordSchema`, `verificationCodeSchema` |

### Định dạng response API (bắt buộc)

```jsonc
// Thành công
{ "status": "success", "statusCode": 200, "message": "LOGIN_SUCCESS", "data": { ... }, "meta": { "page": 1 } }
// Lỗi
{ "status": "error", "statusCode": 400, "message": "VALIDATION_ERROR", "errors": [{ "field": "phone", "message": "INVALID_PHONE_NUMBER" }] }
```

- `message` **luôn là mã KEY** viết hoa (`UPPER_SNAKE_CASE`), không phải câu văn. FE dịch qua `messages/<locale>/errors.json`.
- Danh sách phân trang trả `meta: { page, limit, totalItems, totalPages }`.

### Tiền tệ
- **API và Server Action luôn trả số nguyên VND (`number`)** — không trả `Decimal` của Prisma (không serialize được qua Server Action), không trả chuỗi đã định dạng.
- Chuyển đổi tại ranh giới bằng `toVnd(decimal)`; hiển thị bằng `formatVnd(amount, locale)`.
- Giá trị đơn hàng cuối cùng **luôn do server tính lại**; số liệu ở client chỉ để hiển thị.

---

## 5. Backend (`apps/api`)

### Cấu trúc thư mục (Modular Monolith, phân tầng)

```text
src/
├── app.ts               # createApp(): middleware, health check, router, errorHandler — KHÔNG listen (test được)
├── server.ts            # Entry: listen + tắt êm (dev: tsx watch src/server.ts, prod: tsx src/server.ts)
├── routes.ts            # Router trung tâm — đăng ký router của từng module
├── config/              # env.ts (Zod), swagger.ts
├── infra/               # Kết nối dịch vụ ngoài: redis, cloudinary, mailer, sms
├── core/
│   ├── http/            # AppError, response (sendSuccess / sendError)
│   ├── middlewares/     # authGuard, errorHandler, requestLogger, validate, rateLimit (middleware)
│   ├── security/        # jwt, password, session, authCookies, verificationCode, rateLimit (đếm Redis)
│   └── utils/           # Hàm thuần: number, phone, time
└── modules/<module>/
    ├── <module>.routes.ts      # Khai báo endpoint + Swagger JSDoc
    ├── <module>.controller.ts  # Mỏng: đọc req -> gọi service -> sendSuccess / next(error)
    ├── <module>.service.ts     # Logic nghiệp vụ + Prisma
    ├── <module>.schema.ts      # Zod schema { body, query, params }
    ├── <module>.types.ts       # (tùy chọn) kiểu nội bộ module
    └── KEYS.md                 # Danh sách mã phản hồi/lỗi của module
```

- Module lớn được chia **submodule** theo đối tượng dùng, giữ chung routes/schema ở gốc module: `modules/auth/{client,admin}/` mỗi thư mục có `auth.controller.ts` + `auth.service.ts`.
- Phụ thuộc một chiều: `modules` → `core` / `infra` / `config`; `core` → `infra` / `config`; `infra` → `config`. `core` và `infra` **không** import từ `modules`.
- Đăng ký router trong `src/routes.ts`. Import Prisma từ `@repo/db` (không import `@prisma/client`).
- ESLint (`apps/api/eslint.config.mjs` → `nodeConfig()` của `@repo/config`, §2) cấm `any`; tham số cố ý không dùng đặt tên bắt đầu bằng `_` (vd. `_next` của error handler).

### Thứ tự middleware trên route

```ts
router.post('/path', validate(schema), rateLimit({...}), requireAuth, requireRoles([...]), controller.handler)
```

- `validate` đặt **trước** `rateLimit` khi giới hạn theo trường trong body (body đã được chuẩn hóa).
- Controller không chứa logic nghiệp vụ; luôn `try/catch` và `return next(error)`.

### Lỗi & phản hồi
- Lỗi nghiệp vụ: `throw new AppError(statusCode, 'MA_KEY')`. Lỗi Zod/Prisma/JWT/Multer được `errorHandler` chuẩn hóa.
- Phản hồi thành công qua `sendSuccess(res, { data, message: 'MA_KEY', statusCode })`.
- Mỗi KEY mới phải được: (1) ghi vào `KEYS.md` của module, (2) thêm bản dịch vi/en vào `apps/web/messages/*/errors.json`.
- Không trả stack trace/ thông điệp nội bộ ra ngoài ở production (đã xử lý trong `sendError`).

### Tiện ích bắt buộc dùng (không tự viết lại)

| Nhu cầu | Dùng |
| :--- | :--- |
| Lỗi nghiệp vụ | `AppError` — `core/http/AppError.ts` |
| Giới hạn tần suất | Middleware `rateLimit()` — `core/middlewares/rateLimit.ts`; trong service `assertRateLimit()` — `core/security/rateLimit.ts` (Redis) |
| Mã xác minh OTP/email | `issueVerificationCode()` / `verifyVerificationCode()` — `core/security/verificationCode.ts` |
| Cookie phiên | `setCustomerSessionCookies()` / `setAdminSessionCookies()` / `clear*()` — `core/security/authCookies.ts` |
| Phiên đăng nhập | `hashToken()`, `cleanupUserSessions()`, `revokeAllUserSessions()` — `core/security/session.ts` |
| Gửi email mã | `sendVerificationCodeEmail()` — `infra/mailer.ts` |
| Chuẩn hóa SĐT | `normalizeVietnamPhone()` (từ `@repo/shared`) |

### Tài liệu API
- Mỗi endpoint có Swagger JSDoc `@openapi`: summary, mô tả nghiệp vụ, request body, **liệt kê mã lỗi theo status**.
- Swagger UI chỉ bật ngoài production (`/api-docs`).

### Vận hành
- `helmet`, giới hạn body `100kb`, `requestLogger` (không log body/header), health check `/api/health` kiểm tra DB + Redis, graceful shutdown.
- Không `console.log` dữ liệu nhạy cảm (mật khẩu, token, OTP — riêng mock SMS/email ở dev được phép).

---

## 6. Xác thực & bảo mật

### Mô hình phiên

| | Khách hàng | Admin / Staff |
| :--- | :--- | :--- |
| Access token | JWT RS256 15 phút, **chỉ trong bộ nhớ** (Zustand `authStore`), gửi qua `Authorization: Bearer` | JWT RS256 1 ngày / 7 ngày (ghi nhớ), cookie **httpOnly** `admin_token`, `SameSite=Strict` |
| Làm mới | Cookie httpOnly `refreshToken` (xoay vòng khi "ghi nhớ", ân hạn 30 giây cho nhiều tab) | Không có refresh — hết hạn phải đăng nhập lại |
| Cờ cho UI | `has_session=1` (không httpOnly, không chứa bí mật) | `admin_session=<ROLE>` (chỉ để hiển thị, **không dùng phân quyền**) |
| Thu hồi | Bảng `UserSession` (đăng xuất, đổi/đặt lại mật khẩu, khóa tài khoản) | Bảng `UserSession` — `requireAuth` kiểm tra phiên mỗi request |

### Quy tắc bắt buộc
1. **Cookie auth chỉ do Backend đặt/xóa** (qua `authCookies.ts`). Client **không** ghi `document.cookie` cho mục đích xác thực, không lưu token/thông tin người dùng vào `localStorage`.
2. Express chỉ đọc token từ header Bearer, **ngoại lệ duy nhất** là cookie `admin_token` (SameSite=Strict). Không thêm cookie auth nào khác vào `extractToken`.
3. **Mọi Server Action admin** gọi `authorizeAdminAction({ role?, permission? })` ở dòng đầu tiên, rồi **kiểm tra lại tham số** bằng `parseActionInput(schema, input)` — Server Action là endpoint công khai, kiểu TypeScript không tồn tại lúc chạy. (Ngoại lệ: quyền phụ thuộc chính tham số, vd. cột Kanban → parse trước rồi mới chọn quyền.) **Mọi page admin đọc DB** gọi `requireAdminPage()`.
4. **Không tin định danh từ client**: người thực hiện (`requestedById`, `reviewedById`, `staffId`, `createdById`...) luôn lấy từ phiên ở server — và **không có mặt** trong kiểu tham số của action (schema không khai báo thì client không gửi được).
5. **Không trả `error.message` nội bộ** (Prisma, thư viện) về client — log ở server, trả mã KEY hoặc thông điệp cố định.
6. Mã xác minh: tối đa 5 lần nhập sai/mã (đếm trước khi so sánh), so sánh constant-time, mã dùng một lần. Mọi endpoint gửi mã/đăng nhập/kiểm tra tài khoản phải có rate-limit.
7. Không để lộ tài khoản có tồn tại hay không ở đăng nhập (`INVALID_CREDENTIALS`) và quên mật khẩu (luôn trả thành công).
8. Đổi email/SĐT phải qua xác minh mã. Chỉ SĐT **đã xác minh** mới dùng được cho đăng nhập OTP / đặt lại mật khẩu.
9. Google: tra `SocialAccount(GOOGLE, sub)` trước; chỉ tự liên kết qua email khi email tài khoản **đã xác minh**, ngược lại trả `GOOGLE_EMAIL_ACCOUNT_UNVERIFIED`.
10. Next proxy (`proxy.ts`) chỉ là lớp chặn sớm — kiểm tra quyền thật luôn nằm ở Server Action / page / Express.
11. Production phải có reverse proxy (nginx/Cloudflare) trước Next.js đặt `X-Forwarded-For` đúng; cấu hình `TRUST_PROXY` tương ứng (rate-limit theo IP phụ thuộc vào điều này).

---

## 7. Frontend (`apps/web`)

### Cấu trúc thư mục

```text
src/
├── app/[locale]/(store|auth|admin)/   # CHỈ route, layout, loading, not-found. Page chỉ lắp ráp feature, không chứa component/logic
├── components/
│   ├── ui/            # CHỈ component shadcn sinh từ CLI (button, dialog, select...) — không đặt component tự viết ở đây
│   ├── effects/       # Hiệu ứng/animation từ registry (react-bits, magicui): ClickSpark, Counter, FallingPetals, AnimatedThemeToggler
│   ├── shared/        # Component dùng lại ở NHIỀU feature, không phụ thuộc feature (AppDialog, ActionButton, TextField, OtpInput...)
│   ├── layout/        # Khung trang storefront: header/, footer/, Container, Breadcrumbs, ConditionalFooter, Show (được dùng feature qua index)
│   ├── feedback/      # Màn trạng thái toàn trang: NotFoundView, ForbiddenView
│   └── providers/     # AppProviders (React Query, khôi phục phiên, nạp giỏ hàng), SmoothScrollProvider
├── features/<feature>/                # Xem "Khuôn một feature" bên dưới
├── hooks/             # Hook dùng chung: useNotify, useLocalStorageBoolean, useHasBottomBar
├── i18n/              # next-intl routing + request config + ClientMessages (bản dịch gửi xuống client)
├── lib/               # api-client (HTTP), messages (trích xuất + dịch + toast), utils (cn, resolveClassName), input-mask, catalog, jwt.server
└── proxy.ts           # Middleware Next 16: i18n + chặn route
```

### Khuôn một feature (chỉ tạo thư mục khi cần)

```text
features/<feature>/
├── api/           # CHỈ hàm gọi Express qua apiClient (không chứa dữ liệu mock)
├── components/    # Component của feature; được chia thư mục con kebab-case theo màn con (login/, detail/, manage-address/)
│                  #   — KHÔNG lồng components/ bên trong, KHÔNG barrel con
├── constants/     # Cấu hình UI cố định, sống lâu dài (bộ lọc, tùy chọn may đo, thông tin cửa hàng, nội dung trang tĩnh)
├── data/          # CHỈ dữ liệu mock tạm thời — xóa khi có API thật
├── hooks/
├── store/         # Zustand (nếu có client state)
├── types/         # Kiểu dữ liệu — không import từ components, không re-export dữ liệu
├── utils/         # Hàm thuần (tính toán, map dữ liệu)
├── validations/   # Zod schema của form
└── index.ts       # Public API — barrel DUY NHẤT của feature (bắt buộc)
```

- Phụ thuộc một chiều trong feature: `components` → `hooks` / `store` / `api` → `utils` / `constants` / `data` / `types`. Tầng dưới **không** import ngược từ `components/` (kể cả để lấy hằng số hay kiểu — chuyển chúng về `constants/` / `types/`).
- Import trong cùng feature dùng đường dẫn tương đối; giữa các feature dùng `@/features/<x>` (index).

### Component chung hay riêng?
- Chỉ đưa vào `components/shared` khi **từ 2 feature trở lên** dùng, hoặc là primitive form/UI tổng quát (TextField, SelectField, MediaUploader).
- Phần trang trí / nghiệp vụ chỉ một màn dùng (SaleGlow, HeartToggle, RatingBadge, ClipReveal...) đặt ngay trong feature đó.
- Trước khi tự viết nút, ô nhập, dialog, khung trang → dùng `ActionButton` / `ActionLink`, `TextField`, `AppDialog`, `Container` (xem `apps/web/AGENTS.md` §7).

### Ranh giới import
> Các luật dưới đây được **ESLint cưỡng chế** (`no-restricted-imports` trong `apps/web/eslint.config.mjs`) — vi phạm làm `pnpm lint` đỏ. Đổi luật thì sửa cả file cấu hình lẫn mục này.

- `lib/` **không** import từ `features/`; về component chỉ được dùng `components/ui` (vd. `showToast`). Trạng thái auth được feature đăng ký vào `apiClient` qua `configureApiClient()`.
- `hooks/` (dùng chung), `components/ui`, `components/shared`, `components/effects`, `components/feedback` **không** import từ `features/`. Chỉ `components/layout` và `components/providers` (nối các store khi khởi động) được dùng feature (qua index).
- Import chéo giữa các feature đi qua `index` của feature (`@/features/cart`), không import sâu vào file nội bộ — ngoại trừ file `*.server.ts`, `features/admin/core/server/*` và `features/admin/core/session/permissions` (page server cần mà không kéo component client của `session`).
- Admin không có barrel tổng: import `@/features/admin/core/<x>` hoặc `@/features/admin/modules/<m>`.
- Tầng dưới của feature / module admin (`api`, `constants`, `data`, `hooks`, `store`, `types`, `utils`, `validations`, `schemas`, `queries`) không import từ `components/`.
- `index.ts` của module admin không export `schemas/`.
- Path alias: `@/*` → `src/*`.
- Barrel `index.ts` chỉ được tree-shake nhờ `"sideEffects"` trong `apps/web/package.json` (chỉ liệt kê `*.css` và `features/auth/store/authStore.ts`). Module mới có lệnh chạy ở cấp module (không nằm trong hàm/khai báo) **phải** được thêm vào danh sách này, nếu không bundler có thể bỏ mất lệnh đó.
- Component/dữ liệu lớn chỉ dùng khi người dùng thao tác (khung chat, bảng tìm kiếm, danh mục mock) tải bằng `next/dynamic` hoặc `import()` — không đưa vào bundle chung của mọi trang.
- Provider của thư viện bên thứ ba (vd. `GoogleOAuthProvider` nạp script Google) đặt tại component cần nó (`GoogleAuthButton`), không bọc toàn ứng dụng.

### Server vs Client Component
- Mặc định là **Server Component**. Chỉ thêm `"use client"` khi cần state, effect, event handler hoặc API trình duyệt.
- Trang cần SEO (danh sách/chi tiết sản phẩm, tin tức) lấy dữ liệu ở Server Component (`apiClient` tự dùng `API_INTERNAL_URL` khi chạy ở server).

### Quản lý state & dữ liệu

| Loại dữ liệu | Công cụ |
| :--- | :--- |
| Dữ liệu từ server ở client (Express hoặc Server Action) | **TanStack React Query** (`useQuery` / `useMutation`, query key dạng mảng `['admin', 'staff']`) |
| Client state dùng chung | **Zustand** (`authStore` khách hàng, `cartStore`, ...) |
| Tùy chọn tiện ích của trình duyệt | `useLocalStorageBoolean` (không dùng cho dữ liệu nghiệp vụ) |
| State cục bộ của form | React Hook Form + Zod |

- **Không** fetch dữ liệu trong `useEffect` + `useState`. **Không** `setState` đồng bộ trong `useEffect` — dùng React Query, `useSyncExternalStore` (cho nguồn ngoài như localStorage, cookie, Embla), hoặc "điều chỉnh state khi prop đổi" ngay trong render.
- Store persist (`zustand/persist`) dùng `skipHydration` + rehydrate ở client để tránh lệch hydration.
- Không đồng bộ state giữa component bằng `window` event tự chế — dùng chung một store.

### Gọi API
- Luôn qua `apiClient` (`@/lib/api-client`) với đường dẫn `/api/...`. Không `fetch` trực tiếp tới Express.

### Hiển thị thông điệp (message)
- Mọi xử lý message nằm ở `@/lib/messages`: `extractErrorMessage` (lấy mã từ lỗi), `translateMessage` (dịch KEY — hỗ trợ nhiều KEY của lỗi validation), `notifyError` / `notifySuccess` (toast).
- Lỗi từ API / Server Action: `notifyError(err, 'FALLBACK_KEY', t)` hoặc hook `useNotify().error(errOrKey, 'FALLBACK_KEY')` (dịch qua namespace `Errors`).
- **Fallback phải là mã KEY hoặc câu đã dịch** (`t("...")`) — không truyền tên key i18n thô (ví dụ `"loginError"`), nếu không người dùng sẽ thấy nguyên chuỗi đó.
- **Không viết cứng text** trong `showToast`, lỗi form, thông báo state — dùng `t(...)`. Toast thành công của admin nằm ở `AdminPage.toasts`.

### Form & validation
- React Hook Form + Zod; dùng validator từ `@repo/shared/validation` (SĐT, mật khẩu, mã OTP) để khớp tuyệt đối với backend.

### Giao diện
- Tailwind CSS v4 (không dùng cú pháp v3), `cn()` (đã tích hợp `tailwind-merge`) để ghép class; className dạng hàm của Base UI dùng `resolveClassName()`.
- Thêm component shadcn bằng CLI theo `components.json`.
- Ảnh: `next/image`; nguồn ảnh mới phải thêm vào `images.remotePatterns`. Ảnh từ URL tùy ý (blob xem trước, avatar người dùng) được dùng `<img>` kèm comment lý do.
- **Màu storefront chỉ dùng token** trong `src/app/globals.css` (`bg-(--bg-wine)/80`, `text-(--danger)`, `text-primary-ink`...) — không viết class hex. Cần màu mới → thêm token ở `:root` (chế độ tối kế thừa hoặc ghi đè). Admin dùng tông đơn sắc theo `docs/guides/admin-ui.md` — không trộn lẫn.
- Hiển thị tiền bằng `formatVnd(amount, locale)` — không tự ghép `toLocaleString() + "₫"`.

---

## 8. Khu vực quản trị (Admin)

### Cấu trúc: `core/` (khung dùng chung) và `modules/` (nghiệp vụ)

```text
features/admin/
├── core/
│   ├── auth/      # Màn đăng nhập admin + adminLogin/adminLogout api (gọi Express /api/auth/admin/*)
│   ├── server/    # adminAuth.server.ts (checkAuthAdmin, authorizeAdminAction, requireAdminPage),
│   │              # db.server.ts, actionInput.ts (parseActionInput)
│   ├── session/   # permissions.ts (ma trận quyền), useAdminSession, AdminProfileDialog, PermissionGate, action hồ sơ/mật khẩu
│   ├── layout/    # AdminHeader, AdminSubNav, AdminMobileNav, AdminUserMenu, useAdminLayout, utils/navigation.ts (menu)
│   └── ui/        # AdminPage, AdminPageHeader, AdminMetaValue, ADMIN_CARD_CLASS...
└── modules/<module>/   # approvals, cms, customers, dashboard, inventory, orders, products, staff, tailoring, vouchers
    ├── actions/<module>.actions.ts   # "use server" — mutation + đọc dữ liệu cho client component
    ├── queries/<module>.queries.ts   # CHỈ hàm đọc Prisma — gọi từ Server Component / Server Action
    ├── schemas/<module>.schemas.ts   # Zod cho tham số action — KHÔNG export qua index (có enum Prisma, không được lọt vào client)
    ├── components/                   # UI (client component dùng React Query gọi action)
    ├── types/  utils/  hooks/        # (khi cần)
    └── index.ts                      # Barrel DUY NHẤT của module
```

- Không có barrel tổng `features/admin/index.ts`: page import từ index của từng core/module (`@/features/admin/modules/orders`).
- Trong cùng core/module dùng đường dẫn tương đối; giữa core/module dùng alias `@/features/admin/core/<x>` hoặc `@/features/admin/modules/<x>`.
- File trong `actions/` **phải** là Server Action (`"use server"`); hàm client gọi Express đặt trong `api/`. File trong `queries/` chỉ đọc Prisma — cấu hình tĩnh (menu...) đặt trong `utils/` hoặc `constants/`.

### Ma trận phân quyền (nguồn duy nhất: `features/admin/core/session/permissions.ts`)

| Module | ADMIN | STAFF cần quyền | Ghi chú nghiệp vụ |
| :--- | :---: | :--- | :--- |
| Tổng quan (dashboard) | ✓ | — (mọi nhân viên) | Mỗi khối hiển thị theo quyền: số liệu doanh thu/biểu đồ = `canViewReports`, cảnh báo tồn kho = `canManageInventory`, theo dõi may đo = `canUpdateTailoring`, đơn hàng mới = `canManageOrders` |
| Đơn hàng | ✓ | `canManageOrders` | Cập nhật trạng thái xử lý & thanh toán; hủy đơn / hoàn tiền / giảm giá tay phải gửi yêu cầu phê duyệt |
| Xưởng may đo | ✓ | `canUpdateTailoring` | Cập nhật công đoạn, người thực hiện ghi vào TailoringLog |
| Sản phẩm, Tồn kho | ✓ | `canManageInventory` | Bật/tắt sản phẩm, tùy chọn may đo, số lượng tồn |
| Khách hàng | ✓ | `canManageOrders` | Tra cứu thông tin & số đo để xử lý đơn. **Khóa/mở tài khoản chỉ ADMIN** |
| Phê duyệt | ✓ (xem tất cả + duyệt/từ chối) | — | STAFF chỉ thấy yêu cầu do chính mình gửi, không có nút duyệt |
| Nhân sự | ✓ | ✗ | Tạo nhân viên, cấp 5 quyền chi tiết, khóa/mở tài khoản |
| Voucher | ✓ | ✗ | |
| Nội dung & FAQ | ✓ | `canManageContent` | |

- Menu (`getAdminNavLinks`), page (`requireAdminPage(ADMIN_MODULE_ACCESS.<module>)`), Server Action (`authorizeAdminAction(...)`) và nút trên UI (`canAccess(user, ADMIN_ACTION_ACCESS.<action>)`) **đều đọc cùng ma trận này** — không viết điều kiện quyền rời rạc.
- Nhân viên chưa có bản ghi `StaffPermission` = không có quyền chi tiết nào. Tạo nhân viên luôn tạo kèm bản ghi quyền.

### Quy tắc
- Page (`app/[locale]/(admin)/admin/<module>/page.tsx`) là Server Component: `await requireAdminPage(ADMIN_MODULE_ACCESS.<module>)`, `getTranslations("AdminPage.pages.<module>")` rồi gọi query; giao diện dùng `AdminPage` + `AdminPageHeader` (`features/admin/core/ui`), quy chuẩn chi tiết ở `docs/guides/admin-ui.md`.
- Server Action:
  ```ts
  "use server";
  // schemas/<module>.schemas.ts: export const updateSomethingSchema = z.object({ id: z.uuid(), value: ... });
  export async function updateSomethingAction(id: string, value: X) {
    const auth = await authorizeAdminAction({ permission: "canManageOrders" }); // hoặc { role: "ADMIN" }
    if (!auth.success) return auth;

    const input = parseActionInput(updateSomethingSchema, { id, value }); // lỗi -> mã KEY của trường hoặc VALIDATION_ERROR
    if (!input.success) return input;
    try {
      // ... Prisma, dùng auth.user.id làm người thực hiện
      revalidatePath("/admin/<module>");
      return { success: true, data };
    } catch (error) {
      console.error("Lỗi updateSomethingAction:", error);
      return { success: false, error: "Thông điệp cố định / MA_KEY" };
    }
  }
  ```
- Kết quả action luôn dạng `{ success: true, data } | { success: false, error: "MA_KEY" }` — `error` **luôn là mã KEY** (có bản dịch vi/en trong `errors.json`), client hiển thị bằng `useNotify().error(res.error, "FALLBACK_KEY")`. Dữ liệu trả về là object thuần (tiền đã `toVnd`, không trả nguyên bản ghi Prisma có trường nhạy cảm).
- Phân quyền chi tiết theo `StaffPermission`: `canManageOrders`, `canUpdateTailoring`, `canManageInventory`, `canManageContent`, `canViewReports`. Trang/thao tác Super Admin (nhân sự, voucher, khóa khách hàng, duyệt yêu cầu) dùng `{ role: 'ADMIN' }`.
- `PermissionGate` / ẩn nút chỉ là UI — server vẫn phải kiểm tra.
- Thông tin admin hiện tại lấy qua `useAdminSession()` (đọc từ server), không dùng `authStore` (dành cho khách hàng).
- Action nhận object thì khai báo kiểu tham số bằng `z.input<typeof schema>` để client được kiểm tra kiểu theo đúng schema.
- **Text admin cũng phải qua i18n** (`AdminPage.<module>.*`, vi + en). Nhãn trạng thái dịch theo mã (`t(\`status.${status}\`)`), không lưu `label` cứng trong bảng cấu hình.

---

## 9. Database (`packages/db`)

### Quy ước schema
- `id String @id @default(uuid())`; mọi model có `createdAt @default(now())` và `updatedAt @updatedAt`.
- Quan hệ luôn có cột khóa ngoại tường minh; thêm `@@index` cho cột lọc/khóa ngoại thường dùng.
- Tiền: `Decimal @db.Decimal(12, 2)` trong DB, chuyển `toVnd()` khi ra khỏi tầng dữ liệu.
- Snapshot dữ liệu tại thời điểm mua (tên, giá, số đo) lưu trong `OrderItem` — không tham chiếu giá động.
- **Nội dung đa ngôn ngữ:** cột gốc = tiếng Việt (bắt buộc), cột `<field>En` = tiếng Anh (nullable). Đọc bằng `pickLocalized(entity, 'name', locale)`.

### Migration
1. Sửa `prisma/schema.prisma` (không chạy `prisma format` trên cả file nếu chỉ sửa vài dòng — tránh diff lớn).
2. Tạo migration: `pnpm db:migrate --name <ten_thay_doi>` (terminal interactive).
   - Môi trường không interactive (CI, agent): `prisma migrate diff --from-schema-datasource ... --to-schema-datamodel ... --script > prisma/migrations/<timestamp>_<ten>/migration.sql`, kiểm tra SQL, rồi `pnpm db:deploy`.
3. `pnpm db:generate` (trên Windows phải dừng dev server trước — engine DLL bị khóa).
- **Không sửa/xóa migration đã áp dụng** — tạo migration mới. Không dùng `prisma db push` ngoài prototyping.
- Migration phá dữ liệu (đổi tên/xóa cột, đổi kiểu) phải mô tả rõ trong PR và có bước chuyển dữ liệu.

---

## 10. Đa ngôn ngữ (i18n)

- next-intl, locale `vi` (mặc định) và `en`. Mọi route nằm dưới `/[locale]`. Dùng `Link`, `useRouter`, `redirect` từ `@/i18n/routing`.
- File dịch: `messages/<locale>/<namespace>.json`. **Hai locale phải có cùng tập key.**
- `errors.json` chứa **toàn bộ mã lỗi** backend/Server Action trả về và được gộp vào mọi namespace (`Auth.responses`, `ProfilePage.responses`, `AdminPage.login`, `Common.errors`, `Errors`). Namespace riêng có thể ghi đè bằng câu chữ theo ngữ cảnh.
- **Mã thành công** (`*_SUCCESS`, `OTP_SENT_SUCCESS`...) dịch trong `responses` của namespace màn gọi API (`auth.json` → `Auth.responses`, `profile.json` → `ProfilePage.responses`), không nằm trong `errors.json`.
- **Bản dịch gửi xuống trình duyệt:** root layout truyền `messages={{}}` — mỗi route group / page bọc `<ClientMessages namespaces={CLIENT_NAMESPACES.<khu_vực>}>` (`src/i18n/ClientMessages.tsx`) để chỉ gửi namespace mà **Client Component** trong nhánh đó dùng. Provider lồng nhau **thay thế** (không gộp) messages của cha. Server Component dịch ở server nên không cần khai báo. Thêm client component dùng namespace mới → bổ sung vào `CLIENT_NAMESPACES` tương ứng, nếu không màn hình sẽ hiện nguyên tên key.
- Text giao diện (kể cả placeholder, title, aria-label, nhãn trạng thái) phải dùng key dịch — không viết cứng ở cả storefront lẫn admin.
- Số đếm dùng ICU plural ở bản tiếng Anh: `"{count, plural, one {# item} other {# items}}"`.
- Nội dung từ DB: xem §9 (cột `En`).

---

## 11. Git, kiểm tra chất lượng & CI

- Nhánh: `main` (production), `develop` (tích hợp), nhánh tính năng `feat/<ten>`, `fix/<ten>`, `refactor/<ten>`, `docs/<ten>`.
- Commit message tiếng Việt, tiền tố: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:` — ví dụ `feat: thêm module sản phẩm cho storefront`.
- **CẤM** `git add .` (add đúng file), **CẤM** tự `git push` lên `main`/`master`.
- Trước khi commit: `pnpm check` phải xanh (0 lỗi type, 0 lỗi/cảnh báo lint).
- CI (`.github/workflows/ci.yml`) chạy `install → db:generate → typecheck → lint (mọi workspace)` cho mọi PR và push lên `main`/`develop`; phiên bản pnpm lấy từ `packageManager`.

### Cưỡng chế cho AI agent (`.claude/settings.json`)

Quy tắc dự án được cưỡng chế bằng công cụ, không chỉ bằng lời dặn — áp dụng cho Claude Code; agent khác (Cursor, Copilot, Gemini) đọc cùng nguồn quy tắc qua `AGENTS.md`.

| Cơ chế | Tác dụng |
| :--- | :--- |
| `permissions.allow` | Cho chạy không cần hỏi: `pnpm check/typecheck/lint/build`, `git status/diff/log/show` |
| `permissions.deny` + hook `PreToolUse` (`.claude/hooks/guard-bash.mjs`) | Chặn `git add .` / `-A` / `--all`, `git push` lên `main`/`master`, force push, `commit --no-verify`, `git add` file `.env`, `npm install` / `yarn` |
| Hook `PostToolUse` (`.claude/hooks/lint-file.mjs`) | Sau mỗi lần sửa file TS/JS: chạy ESLint riêng file đó, lỗi được trả về để agent sửa ngay |
| Hook `Stop` (`.claude/hooks/check-on-stop.mjs`) | Khi agent dừng mà có thay đổi code chưa kiểm tra: chạy `pnpm check`; đỏ thì agent phải sửa tiếp (nhớ kết quả xanh trong `.claude/.cache/` để không chạy lại vô ích) |

- Cấu hình cá nhân đặt ở `.claude/settings.local.json` (đã gitignore), không sửa file chung để nới quy tắc.
- Thay đổi schema DB, biến môi trường hoặc luồng auth phải ghi rõ trong mô tả PR (cách migrate, biến cần thêm, ai phải đăng nhập lại).

---

## 12. Checklist khi thêm tính năng

> Các checklist dưới đây có bản đầy đủ kèm mẫu file trong skill dự án `.claude/skills/` (`new-api-module`, `new-admin-module`, `new-storefront-feature`, `add-message-key`).

### Endpoint / module Backend
- [ ] Zod schema (`body/query/params`), thông điệp là mã KEY, dùng validator `@repo/shared/validation` nếu có.
- [ ] Route: `validate` → `rateLimit` (nếu công khai/nhạy cảm) → `requireAuth` / `requireRoles`.
- [ ] Service ném `AppError` với mã KEY; transaction cho thao tác nhiều bảng.
- [ ] Tiền trả về là số nguyên VND; không trả `password` hay trường nhạy cảm.
- [ ] Swagger JSDoc đầy đủ mã lỗi; cập nhật `KEYS.md`; thêm bản dịch vi/en vào `errors.json`.

### Feature Storefront
- [ ] Thư mục `features/<ten>/` theo khuôn §7 (`constants/` ≠ `data/`), chỉ một barrel `index.ts`.
- [ ] Gọi API qua `apiClient`; server state bằng React Query hoặc Server Component.
- [ ] Không fetch/setState trong `useEffect`; không ghi cookie/localStorage cho dữ liệu nghiệp vụ (ngoại lệ tạm thời: giỏ hàng / wishlist khách vãng lai, xem §13).
- [ ] Text qua next-intl (đủ vi/en); namespace client mới đã thêm vào `CLIENT_NAMESPACES`; tiền qua `formatVnd`; màu qua token.
- [ ] Phần nặng chỉ dùng khi thao tác → `next/dynamic` / `import()`.

### Màn Admin
- [ ] Module nằm trong `features/admin/modules/<ten>/`; `page.tsx` gọi `requireAdminPage()` và `getTranslations`; query trả object thuần (tiền `toVnd`, không `Decimal`).
- [ ] Mọi Server Action: `authorizeAdminAction` → `parseActionInput(schema, ...)`; người thực hiện lấy từ `auth.user.id`.
- [ ] Không trả `error.message` nội bộ; `revalidatePath` các trang liên quan.
- [ ] Client component dùng React Query gọi action; text qua `AdminPage.<module>.*`.

### Thay đổi Database
- [ ] Migration mới (không sửa migration cũ), SQL đã được xem lại.
- [ ] `pnpm db:generate`; cập nhật seed nếu cần.

---

## 13. Giới hạn đã biết & nợ kỹ thuật

| Hạng mục | Hiện trạng | Hướng xử lý |
| :--- | :--- | :--- |
| Dữ liệu storefront | Sản phẩm, tin tức, wishlist, FAQ, lịch sử đơn... vẫn là **mock** | Xây module `products`, `orders`, `cart` ở Express theo §5, chuyển trang SEO sang Server Component |
| Giỏ hàng | Lưu localStorage (Zustand persist), mã giảm giá demo phía client | API giỏ hàng + đồng bộ model `Cart` khi đăng nhập; voucher xác thực ở server |
| Test | Chưa có test tự động | Ưu tiên test tích hợp auth (supertest) và hàm tính tiền |
| Prettier | Đã có cấu hình chung nhưng **chưa định dạng toàn repo** (~570 file lệch, chủ yếu xuống dòng) nên chưa đưa vào CI | Một commit riêng chỉ chạy `pnpm format` (không lẫn thay đổi khác), sau đó thêm `pnpm format:check` vào CI |
| Import tương đối chéo feature | ESLint chỉ bắt import alias `@/features/...`; `../../<feature khác>/...` chưa bị chặn | Luôn dùng alias khi import feature khác |
| **Chạy API production** | `require('@repo/db')` từ bản build CommonJS **không có** `prisma` nên API không dùng `node dist/server.js`; production chạy `tsx src/server.ts` (`build` chỉ type-check) | Khi cần khởi động nhanh/bundle gọn: build `@repo/db` ra JS hoặc bundle API (tsup) |
| Validate Server Action đọc dữ liệu | Action chỉ đọc (vd. `getApprovalRequestsAction(statusFilter)`) chưa có schema | Thêm khi chạm vào file |
| Ngày giờ ở admin | Một số chỗ `toLocaleString("vi-VN")` cố định tiếng Việt | Đổi sang `useFormatter()` của next-intl |
| Rate-limit theo IP khi dev | Next rewrites chuyển nguyên `X-Forwarded-For` → có thể giả mạo khi không có reverse proxy | Production bắt buộc đặt nginx/Cloudflare + `TRUST_PROXY` (§6.11). Giới hạn theo tài khoản/mã không bị ảnh hưởng |
| Prisma generate trên Windows | Lỗi `EPERM` khi dev server đang chạy | Dừng `pnpm dev` rồi chạy `pnpm db:generate` |
