import { StockHistoryBoard, getStockHistoryQuery } from "@/features/admin/modules/inventory-history";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminInventoryHistoryPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.inventoryHistory);
  const data = await getStockHistoryQuery();

  return (
    <AdminPage>
      <StockHistoryBoard data={data} />
    </AdminPage>
  );
}
