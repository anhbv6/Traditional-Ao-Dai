# 🤝 @repo/shared — Hợp đồng dữ liệu FE ↔ BE

Code dùng chung để Frontend và Backend luôn khớp nhau. Không có bước build — import thẳng mã TypeScript.

## Hai entry

| Import | Nội dung | Phụ thuộc |
| :--- | :--- | :--- |
| `@repo/shared` | `LOCALES`, `pickLocalized`, `ROLES`, kiểu `ApiResponse` / `UserDto`, `AUTH_COOKIES`, `formatVnd`, `toVnd`, `normalizeVietnamPhone` | Không zod (nhẹ, dùng được ở mọi nơi) |
| `@repo/shared/validation` | `vietnamPhoneSchema`, `emailSchema`, `newPasswordSchema`, `verificationCodeSchema`... | Zod v4 |

```ts
import { formatVnd, pickLocalized } from '@repo/shared'
import { emailSchema } from '@repo/shared/validation'
```

## Quy ước

- Chỉ đặt vào đây thứ **cả hai phía** cùng dùng; logic riêng một bên để ở app đó.
- Thông điệp lỗi của validator là mã KEY (`EMAIL_INVALID`...) — nhớ thêm bản dịch ở web.
- Chi tiết: [`AGENTS.md`](AGENTS.md).

## Lệnh

```bash
pnpm --filter @repo/shared typecheck
pnpm --filter @repo/shared lint
```
