import React from "react";
import { Boxes } from "lucide-react";
import { getAdminInventoryQuery, InventoryList } from "@/features/admin/modules/inventory";
import { getTranslations } from "next-intl/server";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.inventory);
  const t = await getTranslations("AdminPage.pages.inventory");

  const variants = await getAdminInventoryQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Boxes}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        meta={t.rich("meta", { count: variants.length, value: (chunks) => <AdminMetaValue>{chunks}</AdminMetaValue> })}
      />

      <InventoryList initialVariants={variants} />
    </AdminPage>
  );
}
