import { SizeChartsBoard, getAdminSizeChartsQuery } from "@/features/admin/modules/size-charts";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminSizeChartsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.sizeCharts);
  const charts = await getAdminSizeChartsQuery();

  return (
    <AdminPage>
      <SizeChartsBoard charts={charts} />
    </AdminPage>
  );
}
