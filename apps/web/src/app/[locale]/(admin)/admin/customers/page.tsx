import React from "react";
import { Users } from "lucide-react";
import { getAdminCustomersQuery, CustomersList } from "@/features/admin/modules/customers";
import { getTranslations } from "next-intl/server";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.customers);
  const t = await getTranslations("AdminPage.pages.customers");

  const customers = await getAdminCustomersQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Users}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        meta={t.rich("meta", { count: customers.length, value: (chunks) => <AdminMetaValue>{chunks}</AdminMetaValue> })}
      />

      <CustomersList initialCustomers={customers} />
    </AdminPage>
  );
}
