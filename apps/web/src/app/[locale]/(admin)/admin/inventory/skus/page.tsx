import { SkuStockBoard, getAdminSkuStockQuery } from "@/features/admin/modules/inventory";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.inventory);
  const data = await getAdminSkuStockQuery();

  return (
    <AdminPage>
      <SkuStockBoard data={data} />
    </AdminPage>
  );
}
