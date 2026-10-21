import React from "react";
import { Ticket } from "lucide-react";
import { getAdminVouchersQuery, VouchersList } from "@/features/admin/modules/vouchers";
import { getTranslations } from "next-intl/server";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminVouchersPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.vouchers);
  const t = await getTranslations("AdminPage.pages.vouchers");

  const vouchers = await getAdminVouchersQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Ticket}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        meta={t.rich("meta", { count: vouchers.length, value: (chunks) => <AdminMetaValue>{chunks}</AdminMetaValue> })}
      />

      <VouchersList initialVouchers={vouchers} />
    </AdminPage>
  );
}
