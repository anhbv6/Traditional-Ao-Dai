# Copilot Instructions

Đọc file `AGENTS.md` ở root dự án để hiểu đầy đủ quy tắc.
Đọc file `AGENTS.md` trong từng thư mục con khi làm việc trong đó.

## Quick Reference
- Monorepo: pnpm workspaces (apps/api, apps/web, packages/db)
- KHÔNG dùng npm/yarn. Chỉ dùng pnpm.
- KHÔNG commit .env. KHÔNG git push main. KHÔNG git add .
- Next.js 16 (App Router) + React 19 — Đọc docs tại node_modules/next/dist/docs/
- Backend: Express.js 4 + Prisma + JWT
- Sau khi sửa code, chạy build/type-check để kiểm tra.
