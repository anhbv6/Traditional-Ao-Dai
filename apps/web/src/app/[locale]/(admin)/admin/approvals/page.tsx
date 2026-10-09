import { AdminApprovalsList } from "@/features/admin";
import { requireAdminPage } from "@/features/admin/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/session/permissions";
import { AdminPage } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.approvals);

  return (
    <AdminPage>
      <AdminApprovalsList />
    </AdminPage>
  );
}
