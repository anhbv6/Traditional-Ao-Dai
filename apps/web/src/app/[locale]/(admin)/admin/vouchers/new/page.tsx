import { notFound } from "next/navigation";
import { VoucherEditor, getVoucherEditorQuery } from "@/features/admin/modules/vouchers";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminNewVoucherPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.vouchers);
  const data = await getVoucherEditorQuery(null);
  if (!data) notFound();

  return (
    <AdminPage>
      <VoucherEditor data={data} />
    </AdminPage>
  );
}
