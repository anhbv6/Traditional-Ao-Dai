import { AdminDashboard } from "@/features/admin/modules/dashboard";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdminPage(ADMIN_MODULE_ACCESS.dashboard);

  return <AdminDashboard user={user} />;
}
