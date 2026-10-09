import { AdminStaffManagement } from "@/features/admin";
import { requireAdminPage } from "@/features/admin/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/session/permissions";
import { AdminPage } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.staff);

  return (
    <AdminPage>
      <AdminStaffManagement />
    </AdminPage>
  );
}
