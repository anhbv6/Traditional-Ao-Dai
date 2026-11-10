import { RolePermissionsBoard, getStaffBoardQuery } from "@/features/admin/modules/staff";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminRolePermissionsPage() {
  const user = await requireAdminPage(ADMIN_MODULE_ACCESS.rolePermissions);
  const data = await getStaffBoardQuery(user.id);

  return (
    <AdminPage>
      <RolePermissionsBoard data={data} />
    </AdminPage>
  );
}
