# 🛠️ Runbook — Thay đổi gì thì làm gì

Tra theo tình huống. Mỗi mục: **làm ở code** → **làm ở dịch vụ** (Neon / Render / Vercel...) → **kiểm tra**. Cấu hình gốc từng dịch vụ: [`README.md`](README.md) §5.

**Nguyên tắc chung**
- Mọi thay đổi đi qua `develop` → `main`. Push `main` = **Render và Vercel tự deploy**; Neon **không** tự chạy migration.
- Trước khi commit luôn: `pnpm check` (xanh).
- Lệnh tới DB production chạy **từ máy local** bằng các lệnh `pnpm db:*:prod` — chỉ đọc `apps/api/.env.production` (gitignored, điền `DATABASE_URL` Neon **direct**). Thiếu file thì lệnh dừng ngay.
- Kiểm tra sau mỗi lần deploy: `https://traditional-ao-dai.vercel.app/api/health` → `database: ok, redis: ok`.

---

## 1. Sửa code thông thường (FE / BE, không đụng DB, env, package)

```bash
pnpm check
git add <file đã sửa>
git commit -m "feat: ..."
git push origin develop        # mở PR develop -> main, CI chạy typecheck + lint
```

Merge vào `main` → Render (API) và Vercel (Web) tự build. Theo dõi tab **Events/Logs** (Render) và **Deployments** (Vercel).

## 2. Sửa schema database

**Local**
```bash
# Windows: dừng `pnpm dev` trước (tránh lỗi EPERM khi generate)
pnpm db:migrate --name <ten_thay_doi>    # tạo + áp migration vào DB local
pnpm db:generate
pnpm check
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations/<thư mục mới>
```
- Không sửa/xóa migration cũ; không `db push`. Migration đổi tên/xóa cột/đổi kiểu → viết tay SQL chuyển dữ liệu (AGENTS.md §9).
- Cập nhật seed (`packages/db/prisma/seed/`) nếu dữ liệu mẫu bị ảnh hưởng.

**Production — thứ tự quan trọng**

| Loại migration | Thứ tự |
| :--- | :--- |
| Chỉ **thêm** (bảng, cột nullable, index) | Áp migration lên Neon **trước** → rồi merge `main` |
| **Phá vỡ** (xóa/đổi tên cột, đổi kiểu) | Tách 2 bước: (1) deploy code chịu được cả schema cũ lẫn mới, (2) áp migration. Hoặc chấp nhận vài phút lỗi khi dự án chưa có khách thật |

```bash
pnpm db:status:prod     # xem migration nào chưa áp
pnpm db:deploy:prod     # áp lên Neon
```
- Migration đổi email/khóa unique: kiểm tra dữ liệu trùng trên Neon SQL Editor trước khi áp.
- Muốn thử migration an toàn: Neon → **Branches** → tạo branch từ `production` → tạm đổi `DATABASE_URL` trong `.env.production` sang chuỗi của branch đó → `pnpm db:deploy:prod` → kiểm tra xong đổi lại và xóa branch.
- Render tự `prisma generate` lúc build; Vercel generate qua `postinstall` — không cần thao tác thêm.

## 3. Thêm / đổi biến môi trường

**Code**
1. Thêm vào `apps/api/.env.example` hoặc `apps/web/.env.example`, đúng nhóm, ghi chú `[BẮT BUỘC]` / `[TÙY CHỌN]` + cách lấy giá trị.
2. API: khai báo trong `apps/api/src/config/env.ts` (Zod). Biến bí mật **không** có tiền tố `NEXT_PUBLIC_`.
3. Điền vào `.env.local` của app tương ứng (Next.js tự nhận khi dev server đang chạy; API `tsx watch` tự khởi động lại).

**Dịch vụ**

| Biến thuộc | Làm ở đâu | Sau khi lưu |
| :--- | :--- | :--- |
| API | Render → service → **Environment** | Chọn *Save, rebuild and deploy* |
| Web | Vercel → Project → **Settings → Environment Variables** (tick Production + Preview) | **Redeploy** bản mới nhất (bắt buộc với `NEXT_PUBLIC_*`, `API_INTERNAL_URL` — đọc lúc build) |
| Cả hai (`DATABASE_URL`, `JWT_PUBLIC_KEY`) | Render **và** Vercel | Deploy lại cả hai |

`DATABASE_URL`: Render và migration dùng Neon **direct**; Vercel dùng Neon **pooled** + `&pgbouncer=true&connection_limit=1`.

## 4. Thêm / gỡ package

```bash
pnpm --filter @repo/<workspace> add <pkg>      # -D cho devDependency
pnpm check
git add apps/<ws>/package.json pnpm-lock.yaml   # BẮT BUỘC commit lockfile
```
Render cài bằng `--frozen-lockfile` → thiếu/lệch `pnpm-lock.yaml` là build fail. Không cần thao tác gì trên dịch vụ.

## 5. Đổi phiên bản Node / pnpm

1. pnpm: sửa `packageManager` ở `package.json` gốc → `pnpm install` → commit `package.json` + `pnpm-lock.yaml`.
2. Node: sửa `engines` ở `package.json` gốc.
3. Render → Environment: `NODE_VERSION`. Vercel → Settings → mục **Node.js Version** (trang Build & Deployment). CI đọc pnpm từ `packageManager`.

## 6. Thêm nguồn ảnh ngoài

Thêm hostname vào `images.remotePatterns` trong `apps/web/next.config.ts` → commit → merge `main` (Vercel build lại). Ảnh upload qua Cloudinary (`res.cloudinary.com`) đã có sẵn.

## 7. Đổi domain / URL

| Thay đổi | Cập nhật |
| :--- | :--- |
| Domain web (Vercel) | Render `FRONTEND_URL` · Google Cloud → OAuth Client → **Authorized JavaScript origins** · link trong `README.md` |
| Domain API (Render) | Vercel `API_INTERNAL_URL` (không `/` cuối) → Redeploy |
| Thêm reverse proxy / CDN trước API | Render `TRUST_PROXY` = số proxy đứng trước (rate-limit theo IP phụ thuộc vào đây) |

## 8. Xoay vòng khóa / bí mật

| Bí mật | Làm gì | Ảnh hưởng |
| :--- | :--- | :--- |
| Cặp khóa JWT | Tạo cặp mới (README §2) → Render `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY`, Vercel `JWT_PUBLIC_KEY` → deploy lại **cả hai cùng lúc** | **Mọi người bị đăng xuất** |
| Mật khẩu DB Neon | Neon → Roles → Reset password → cập nhật `DATABASE_URL` ở Render + Vercel | Gián đoạn tới khi deploy xong |
| Redis Upstash | Cập nhật `REDIS_URL` ở Render | OTP / rate-limit đang chờ bị mất |
| Cloudinary · Brevo · Google Client ID | Cập nhật biến tương ứng ở Render (Google: cả `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ở Vercel) | — |

Bí mật lộ ra ngoài → đổi ngay, sau đó kiểm tra `AuditLog` và bảng `UserSession` để thu hồi phiên lạ.

## 9. Seed dữ liệu production

Chỉ chạy **lần đầu** (hoặc khi cần tạo lại tài khoản admin):

Điền `SEED_ADMIN_PASSWORD` (mật khẩu mạnh) trong `apps/api/.env.production`, rồi:

```bash
pnpm db:seed:prod       # tự đặt SEED_DEMO_DATA=false — chỉ tạo admin + danh mục
```
Seed không ghi đè mật khẩu tài khoản đã có. Không bao giờ chạy `pnpm db:seed` (bản local, có demo) với chuỗi Neon.

## 10. Sự cố & khôi phục

| Tình huống | Cách xử lý |
| :--- | :--- |
| Deploy web lỗi | Vercel → Deployments → bản tốt gần nhất → **Promote to Production** |
| Deploy API lỗi | Render → Events → bản tốt gần nhất → **Rollback** |
| Migration làm hỏng dữ liệu | Neon → **Restore** (point-in-time) về thời điểm trước khi chạy, hoặc tạo branch từ thời điểm đó để lấy lại dữ liệu — gói free chỉ giữ lịch sử ngắn, nên xử lý ngay. Code: viết migration mới để sửa, **không** xóa migration đã áp |
| `/api/health` báo `database` lỗi | Neon có thể đang ngủ (gói free) — gọi lại sau vài giây; kiểm tra `DATABASE_URL` |
| Request đầu chậm ~50s | Render free ngủ sau 15 phút — bình thường |
| Build Render fail `ERR_PNPM_OUTDATED_LOCKFILE` | Chạy `pnpm install` ở local, commit `pnpm-lock.yaml` |
| Đăng nhập Google lỗi ở bản Preview | Bình thường — Preview không nằm trong Authorized origins |

## 11. Checklist trước khi merge vào `main`

- [ ] `pnpm check` xanh, CI xanh trên PR.
- [ ] Có migration mới → đã quyết định thứ tự (§2) và đã/ sẽ chạy `pnpm db:deploy:prod` lên Neon.
- [ ] Có biến môi trường mới → đã thêm ở Render / Vercel (§3).
- [ ] Đổi luồng auth / JWT → ghi trong PR ai phải đăng nhập lại.
- [ ] Sau deploy: `/api/health` ok, thử đăng nhập storefront + admin.
