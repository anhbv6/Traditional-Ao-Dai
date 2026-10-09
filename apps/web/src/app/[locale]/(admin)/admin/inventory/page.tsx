import React from "react";
import { Boxes } from "lucide-react";
import { getAdminInventoryQuery, InventoryList } from "@/features/admin/inventory";
import { requireAdminPage } from "@/features/admin/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.inventory);

  const variants = await getAdminInventoryQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Boxes}
        eyebrow="Kho vận & Biến thể"
        title="Quản Lý Tồn Kho"
        description="Theo dõi và điều chỉnh số lượng tồn của từng mã SKU (size, màu)."
        meta={<>Tổng cộng <AdminMetaValue>{variants.length}</AdminMetaValue> mã SKU biến thể</>}
      />

      <InventoryList initialVariants={variants} />
    </AdminPage>
  );
}
