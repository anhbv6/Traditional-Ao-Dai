import { AdminDashboard } from "@/features/admin/dashboard";
import { requireAdminPage } from "@/features/admin/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/session/permissions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.dashboard);

  return <AdminDashboard />;
}
