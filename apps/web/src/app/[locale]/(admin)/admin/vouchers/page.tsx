import { VouchersBoard, getAdminVouchersQuery } from "@/features/admin/modules/vouchers";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminVouchersPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.vouchers);
  const data = await getAdminVouchersQuery();

  return (
    <AdminPage>
      <VouchersBoard data={data} />
    </AdminPage>
  );
}
