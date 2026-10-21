---
name: add-message-key
description: Thêm mã thông điệp (KEY UPPER_SNAKE_CASE) mới mà Backend hoặc Server Action trả về — ghi KEYS.md, thêm bản dịch vi/en đúng file (errors.json cho mã lỗi, responses của namespace cho mã thành công) và hiển thị đúng cách ở client. Dùng mỗi khi code trả về một mã KEY chưa có.
---

# Thêm mã KEY mới

Quy chuẩn gốc: `docs/PROJECT_RULES.md` §4 (định dạng response), §5 (Lỗi & phản hồi), §10 (i18n).

## 1. Đặt tên
- `UPPER_SNAKE_CASE`, mô tả kết quả: `THING_NOT_FOUND`, `THING_CREATED`, `STAFF_PERMISSION_DENIED`.
- Kiểm tra mã đã có chưa trước khi thêm: tìm trong `apps/web/messages/vi/errors.json` và `apps/api/src/modules/*/KEYS.md`.
- Lỗi validate chung đã có: `VALIDATION_ERROR` (dùng khi trường không có mã riêng).

## 2. Nơi khai báo
| Loại mã | Ghi tài liệu | Bản dịch vi + en |
| :--- | :--- | :--- |
| Mã lỗi Backend (`AppError`, Zod schema) | `apps/api/src/modules/<module>/KEYS.md` (bảng "Error Keys": KEY, HTTP status, vi, en, ngữ cảnh) | `apps/web/messages/{vi,en}/errors.json` |
| Mã thành công Backend (`sendSuccess`) | `KEYS.md` (bảng "Success Keys") | `responses` của namespace màn gọi API: `messages/{vi,en}/auth.json` → `Auth.responses`, `profile.json` → `ProfilePage.responses` |
| Mã lỗi Server Action admin | — | `errors.json` (vi + en) |
| Mã từ `@repo/shared/validation` | — | `errors.json` (vi + en) — dùng chung FE/BE |

- Hai file vi/en phải có **cùng tập key**.
- `errors.json` được gộp sẵn vào `Auth.responses`, `ProfilePage.responses`, `AdminPage.login`, `Common.errors`, `Errors` (`src/i18n/request.ts`) — không cần chép lại.

## 3. Hiển thị ở client
```ts
const notify = useNotify();
const res = await someAction(...);
if (!res.success) notify.error(res.error, "THING_UPDATE_FAILED"); // fallback cũng là mã KEY
// Lỗi từ apiClient: notifyError(err, "FALLBACK_KEY", t)
```
- Fallback phải là mã KEY hoặc câu đã dịch — không truyền tên key i18n thô (`"loginError"`).
- Không hiển thị `error.message` nội bộ (Prisma, thư viện).

## 4. Kiểm tra nhanh vi/en đủ key
```bash
node -e "const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'?f(v,p+k+'.'):[p+k]);for(const n of require('fs').readdirSync('apps/web/messages/vi')){const a=new Set(f(require('./apps/web/messages/vi/'+n))),b=new Set(f(require('./apps/web/messages/en/'+n)));const d=[...a].filter(x=>!b.has(x)).concat([...b].filter(x=>!a.has(x)));if(d.length)console.log(n,d)}"
```
