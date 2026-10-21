---
name: new-storefront-feature
description: Tạo feature storefront mới trong apps/web/src/features/<feature> đúng khuôn (api/components/constants/data/hooks/store/types/utils/validations + index.ts), gắn page vào app/[locale]/(store), khai báo bản dịch client (CLIENT_NAMESPACES), tối ưu bundle. Dùng khi thêm màn/tính năng phía khách hàng.
---

# Tạo feature storefront mới

Quy chuẩn gốc: `docs/PROJECT_RULES.md` §7 (Frontend), §10 (i18n). Đọc `apps/web/AGENTS.md` (đặc biệt §7 component dùng chung) và docs Next 16 trong `node_modules/next/dist/docs/` trước khi viết code.

## 1. Khuôn thư mục (chỉ tạo thư mục khi cần)

```text
apps/web/src/features/<feature>/
├── api/<feature>.api.ts      # CHỈ gọi Express qua apiClient ("/api/...")
├── components/               # PascalCase.tsx; thư mục con kebab-case theo màn con, KHÔNG lồng components/, KHÔNG barrel con
├── constants/                # cấu hình UI cố định (tùy chọn bộ lọc, thông tin cửa hàng...)
├── data/                     # CHỈ mock tạm thời — xóa khi có API
├── hooks/  store/  types/  utils/  validations/
└── index.ts                  # barrel DUY NHẤT
```
- Tầng dưới (`hooks`, `utils`, `constants`, `data`, `types`) KHÔNG import từ `components/`.
- Trong feature dùng import tương đối; feature khác dùng `@/features/<x>`.

## 2. Page
```tsx
// app/[locale]/(store)/<route>/page.tsx — Server Component, chỉ lắp ráp
import { Container } from "@/components/layout/Container";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";
import { ThingExperience } from "@/features/<feature>";

export default function ThingPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.<area>}>
      <Container as="section">
        <ThingExperience />
      </Container>
    </ClientMessages>
  );
}
```
- Thêm `<area>` vào `CLIENT_NAMESPACES` (`src/i18n/ClientMessages.tsx`) với **đúng** các namespace mà Client Component trong nhánh dùng (provider lồng nhau THAY THẾ messages của cha). Server Component không cần khai báo.
- Namespace mới → thêm file `messages/{vi,en}/<ns>.json` và nạp trong `src/i18n/request.ts`.
- Trang cần SEO lấy dữ liệu ở Server Component; `generateMetadata` dùng `getTranslations`.

## 3. Quy tắc khi viết
- Dữ liệu server ở client: React Query (`useQuery`/`useMutation`). KHÔNG fetch / setState trong `useEffect`.
- State dùng chung: Zustand; store persist dùng `skipHydration` + rehydrate trong `AppProviders`.
- Dùng component có sẵn: `ActionButton`/`ActionLink`, `TextField`, `AppDialog`, `Container`, `ChoiceGroup`, `StepPanel`... Chỉ đưa component vào `components/shared` khi ≥ 2 feature dùng.
- Màu: token trong `globals.css` (`text-(--danger)`, `bg-(--bg-wine)/80`) — không class hex. Tiền: `formatVnd(amount, locale)`.
- Form: React Hook Form + Zod, validator từ `@repo/shared/validation`.
- Phần nặng chỉ dùng khi thao tác (dialog lớn, dữ liệu lớn) → `next/dynamic(() => import(...), { ssr: false })` hoặc `import()` trong `queryFn`.
- Module có lệnh chạy ở cấp module → thêm vào `"sideEffects"` của `apps/web/package.json`.

## 4. Kiểm tra
- [ ] `pnpm check` xanh.
- [ ] Mở trang `/vi/...` và `/en/...`: không hiện tên key thô, không lỗi console.
- [ ] (Khi thêm thư viện / phần lớn) `pnpm --filter @repo/web exec next experimental-analyze --output` để xem bundle không phình ở mọi trang.
