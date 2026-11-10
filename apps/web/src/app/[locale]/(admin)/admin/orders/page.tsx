import { OrdersBoard, getAdminOrdersQuery } from "@/features/admin/modules/orders";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.orders);
  const data = await getAdminOrdersQuery();

  return (
    <AdminPage>
      <OrdersBoard data={data} />
    </AdminPage>
  );
}
