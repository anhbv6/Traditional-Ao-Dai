import { AdminApprovalsList } from "@/features/admin/modules/approvals";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.approvals);

  return (
    <AdminPage>
      <AdminApprovalsList />
    </AdminPage>
  );
}
