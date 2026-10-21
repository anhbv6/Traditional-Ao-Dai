import React from "react";
import { Shirt } from "lucide-react";
import { getAdminProductsListQuery, ProductsList } from "@/features/admin/modules/products";
import { getTranslations } from "next-intl/server";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.products);
  const t = await getTranslations("AdminPage.pages.products");

  const products = await getAdminProductsListQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Shirt}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        meta={t.rich("meta", { count: products.length, value: (chunks) => <AdminMetaValue>{chunks}</AdminMetaValue> })}
      />

      <ProductsList initialProducts={products} />
    </AdminPage>
  );
}
