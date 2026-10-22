# 🔧 @repo/config — Cấu hình công cụ dùng chung

ESLint, tsconfig và Prettier cho mọi workspace. Chỉ cài dạng `devDependency`.

## Nội dung

| Export | Dùng cho |
| :--- | :--- |
| `@repo/config/eslint/base` | `nodeConfig()`, `sharedTsRules` (cấm `any`...) |
| `@repo/config/tsconfig/base.json` | Cấu hình strict chung |
| `@repo/config/tsconfig/node.json` | API, db, shared (Node) |
| `@repo/config/tsconfig/bundler.json` | Web (Next.js) |
| `@repo/config/prettier` | Prettier |

## Dùng trong workspace

```jsonc
// tsconfig.json
{ "extends": "@repo/config/tsconfig/node.json" }
```

```js
// eslint.config.mjs
import { nodeConfig } from '@repo/config/eslint/base'
export default nodeConfig()
```

Sửa luật ở đây sẽ áp dụng cho toàn repo — chạy `pnpm check` ở gốc sau khi sửa.
