import { SaleEventsBoard, getMockSaleEventsBoard } from "@/features/admin/modules/sale-events";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminSaleEventsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.saleEvents);
  // Dữ liệu mock — chưa có bảng SaleEvent (xem saleEvents.mock.ts)
  const data = getMockSaleEventsBoard();

  return (
    <AdminPage>
      <SaleEventsBoard data={data} />
    </AdminPage>
  );
}
