# Copilot Instructions

Đọc `docs/PROJECT_RULES.md` (quy chuẩn đầy đủ) và file `AGENTS.md` ở root dự án.
Đọc file `AGENTS.md` trong từng thư mục con khi làm việc trong đó.

## Quick Reference
- Quy chuẩn đầy đủ: `docs/PROJECT_RULES.md` (nguồn duy nhất) — tóm tắt ở `AGENTS.md` root và từng workspace.
- Monorepo pnpm: apps/api (Express 4), apps/web (Next.js 16 + React 19), packages/db (Prisma), packages/shared (hợp đồng FE/BE). Node >= 22.18.
- KHÔNG dùng npm/yarn. KHÔNG commit .env. KHÔNG git push main. KHÔNG git add .
- Next.js 16 — đọc docs tại node_modules/next/dist/docs/ trước khi viết code (middleware là src/proxy.ts).
- Web gọi API cùng origin qua `/api/*` (Next rewrites) bằng `apiClient`. Cookie auth chỉ do Backend đặt — client không ghi cookie/localStorage cho auth.
- Storefront dùng Express API; Admin dùng Server Actions + Prisma trực tiếp, luôn gọi `authorizeAdminAction()` / `requireAdminPage()`.
- Thông điệp BE↔FE là mã KEY UPPER_SNAKE_CASE, dịch trong `apps/web/messages/<locale>/errors.json` (vi/en đủ key).
- Tiền: API trả số nguyên VND (`toVnd`), hiển thị `formatVnd` (@repo/shared). Validator SĐT/mật khẩu/OTP lấy từ @repo/shared.
- Server state: React Query; client state: Zustand. Không fetch/setState trong useEffect. Không dùng `any`.
- Sau khi sửa code: `pnpm check` (typecheck + lint) phải xanh.
