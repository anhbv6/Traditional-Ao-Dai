import React from "react";
import { Scissors } from "lucide-react";
import { getTailoringItemsQuery, TailoringBoard } from "@/features/admin/modules/tailoring";
import { getTranslations } from "next-intl/server";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminTailoringPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.tailoring);
  const t = await getTranslations("AdminPage.pages.tailoring");

  const tailoringItems = await getTailoringItemsQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Scissors}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        meta={t.rich("meta", { count: tailoringItems.length, value: (chunks) => <AdminMetaValue>{chunks}</AdminMetaValue> })}
      />

      <TailoringBoard initialItems={tailoringItems} />
    </AdminPage>
  );
}
