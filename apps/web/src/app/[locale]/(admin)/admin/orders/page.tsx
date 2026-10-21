import React from "react";
import { ShoppingBag } from "lucide-react";
import { getAdminOrdersListQuery, OrdersList } from "@/features/admin/modules/orders";
import { getTranslations } from "next-intl/server";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.orders);
  const t = await getTranslations("AdminPage.pages.orders");

  const orders = await getAdminOrdersListQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={ShoppingBag}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        meta={t.rich("meta", { count: orders.length, value: (chunks) => <AdminMetaValue>{chunks}</AdminMetaValue> })}
      />

      <OrdersList initialOrders={orders} />
    </AdminPage>
  );
}
