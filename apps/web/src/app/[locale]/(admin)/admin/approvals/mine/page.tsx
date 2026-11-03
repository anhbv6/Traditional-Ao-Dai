import { AdminApprovalsList } from "@/features/admin/modules/approvals";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminApprovalMinePage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.approvalMine);

  return (
    <AdminPage>
      <AdminApprovalsList view="mine" />
    </AdminPage>
  );
}
