import React from "react";
import {
  getAdminProductCategoriesQuery,
  getAdminProductSizeChartsQuery,
  getAdminProductsListQuery,
  ProductsList,
} from "@/features/admin/modules/products";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.products);

  const [products, categories, sizeCharts] = await Promise.all([
    getAdminProductsListQuery(),
    getAdminProductCategoriesQuery(),
    getAdminProductSizeChartsQuery(),
  ]);

  return (
    <AdminPage>
      <ProductsList initialProducts={products} categories={categories} sizeCharts={sizeCharts} />
    </AdminPage>
  );
}
