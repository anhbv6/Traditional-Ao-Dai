---
name: new-admin-module
description: Tạo màn quản trị mới trong apps/web (features/admin/modules/<module>) — page Server Component, query Prisma, Server Action có authorizeAdminAction + parseActionInput (Zod), phân quyền, i18n AdminPage, giao diện AdminPage. Dùng khi thêm hoặc mở rộng một module admin.
---

# Tạo màn admin mới

Quy chuẩn gốc: `docs/PROJECT_RULES.md` §6 (quy tắc 3–5), §8 (Admin). Giao diện: `docs/guides/admin-ui.md`.

## 1. Cấu trúc

```text
apps/web/src/features/admin/modules/<module>/
├── actions/<module>.actions.ts     # "use server" — CHỈ Server Action
├── queries/<module>.queries.ts     # CHỈ hàm đọc Prisma (tiền -> toVnd, không trả Decimal)
├── schemas/<module>.schemas.ts     # Zod cho tham số action — KHÔNG export qua index.ts
├── components/<Module>List.tsx     # "use client"
├── types/<module>.types.ts
└── index.ts                        # barrel duy nhất: export types, queries, actions, components
apps/web/src/app/[locale]/(admin)/admin/<module>/page.tsx
```

## 2. Phân quyền (một nguồn duy nhất)
`features/admin/core/session/permissions.ts`:
- Thêm `<module>` vào `AdminModule` và `ADMIN_MODULE_ACCESS` (`{}` mọi nhân viên, `{ permission: "canX" }`, `{ role: "ADMIN" }`).
- Thao tác nhạy cảm bên trong → thêm vào `ADMIN_ACTION_ACCESS`.
- Menu: thêm mục vào `ADMIN_NAV_CONFIG` (`core/layout/utils/navigation.ts`, không có `label` — nhãn ở `AdminPage.nav.<key>`).

## 3. Mẫu

```ts
// schemas/<module>.schemas.ts
import { z } from "zod";
export const toggleThingSchema = z.object({ thingId: z.uuid(), isActive: z.boolean() });
```

```ts
// actions/<module>.actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toggleThingSchema } from "../schemas/<module>.schemas";

export async function toggleThingAction(thingId: string, isActive: boolean) {
  const auth = await authorizeAdminAction({ permission: "canManageContent" }); // DÒNG ĐẦU
  if (!auth.success) return auth;

  const input = parseActionInput(toggleThingSchema, { thingId, isActive }); // client gửi gì cũng phải parse lại
  if (!input.success) return input;

  try {
    await prisma.thing.update({ where: { id: thingId }, data: { isActive, updatedById: auth.user.id } }); // người thực hiện từ phiên
    revalidatePath("/admin/<module>");
    return { success: true as const };
  } catch (error) {
    console.error("Lỗi toggleThingAction:", error);
    return { success: false as const, error: "THING_UPDATE_FAILED" }; // mã KEY, không trả error.message
  }
}
```
Action nhận object: khai báo `(raw: z.input<typeof schema>)`, sau parse dùng `const params = parsed.data`. Không đưa `xxxById` vào schema.

```tsx
// app/[locale]/(admin)/admin/<module>/page.tsx
import { getTranslations } from "next-intl/server";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/core/ui";
import { getThingsQuery, ThingsList } from "@/features/admin/modules/<module>";

export const dynamic = "force-dynamic";

export default async function AdminThingsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.<module>);
  const t = await getTranslations("AdminPage.pages.<module>");
  const things = await getThingsQuery();
  return (
    <AdminPage>
      <AdminPageHeader icon={Box} eyebrow={t("eyebrow")} title={t("title")} description={t("description")}
        meta={t.rich("meta", { count: things.length, value: (chunks) => <AdminMetaValue>{chunks}</AdminMetaValue> })} />
      <ThingsList initialThings={things} />
    </AdminPage>
  );
}
```

Client component: `const t = useTranslations("AdminPage.<module>")`, gọi action qua React Query / `useTransition`, hiện lỗi bằng `useNotify().error(res.error, "FALLBACK_KEY")`. Tiền `formatVnd(value, locale)`. Màu theo `docs/guides/admin-ui.md` (admin được dùng hex đơn sắc theo bảng token đó).

## 4. i18n
- `apps/web/messages/{vi,en}/admin.json`: `pages.<module>.{eyebrow,title,description,meta}`, `<module>.*`, `nav.<module>`, toast ở `toasts.*`. Hai locale cùng tập key; bản `en` dùng ICU plural cho số đếm.
- `AdminPage` đã nằm trong `CLIENT_NAMESPACES.admin` — không cần khai báo thêm.
- Mã lỗi action mới → skill `add-message-key`.

## 5. Kiểm tra
- [ ] `pnpm check` xanh.
- [ ] Đăng nhập admin (tài khoản seed) → mở màn ở `/vi` và `/en`, không có key thô, không lỗi console (đặc biệt "Decimal objects are not supported").
- [ ] Thử STAFF không có quyền: menu ẩn, URL trực tiếp bị đưa về dashboard, action trả `STAFF_PERMISSION_DENIED`.
