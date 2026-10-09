import React from "react";
import { Shirt } from "lucide-react";
import { getAdminProductsListQuery, ProductsList } from "@/features/admin/products";
import { requireAdminPage } from "@/features/admin/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.products);

  const products = await getAdminProductsListQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Shirt}
        eyebrow="Danh mục & Bộ sưu tập"
        title="Sản Phẩm Áo Dài"
        description="Quản lý trạng thái hiển thị và tùy chọn may đo của từng mẫu thiết kế."
        meta={<>Tổng cộng <AdminMetaValue>{products.length}</AdminMetaValue> mẫu thiết kế</>}
      />

      <ProductsList initialProducts={products} />
    </AdminPage>
  );
}
