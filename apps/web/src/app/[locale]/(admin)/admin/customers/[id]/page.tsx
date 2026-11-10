import { notFound } from "next/navigation";
import { CustomerDetail, getAdminCustomerDetailQuery } from "@/features/admin/modules/customers";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_ACTION_ACCESS, ADMIN_MODULE_ACCESS, canAccess } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminPage(ADMIN_MODULE_ACCESS.customers);
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const data = await getAdminCustomerDetailQuery(id, canAccess(user, ADMIN_ACTION_ACCESS.toggleCustomerActive));
  if (!data) notFound();

  return (
    <AdminPage>
      <CustomerDetail data={data} />
    </AdminPage>
  );
}
