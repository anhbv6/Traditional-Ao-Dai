import { notFound } from "next/navigation";
import { OrderDetail, getAdminOrderDetailQuery } from "@/features/admin/modules/orders";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.orders);
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const data = await getAdminOrderDetailQuery(id);
  if (!data) notFound();

  return (
    <AdminPage>
      <OrderDetail data={data} />
    </AdminPage>
  );
}
