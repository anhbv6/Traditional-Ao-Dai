import { notFound } from "next/navigation";
import { TailoringOrderDetail, getTailoringOrderDetailQuery } from "@/features/admin/modules/tailoring";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminTailoringOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.tailoring);
  const { orderId } = await params;
  // Id không đúng dạng thì 404 luôn, khỏi hỏi DB
  if (!UUID_PATTERN.test(orderId)) notFound();
  const data = await getTailoringOrderDetailQuery(orderId);
  if (!data) notFound();

  return (
    <AdminPage>
      <TailoringOrderDetail data={data} />
    </AdminPage>
  );
}
