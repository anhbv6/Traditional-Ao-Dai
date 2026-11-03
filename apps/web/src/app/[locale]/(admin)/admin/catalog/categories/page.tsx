import { CategoryTreeBoard, getCategoryTreeQuery, getSizeChartOptionsQuery } from "@/features/admin/modules/categories";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.categories);
  const [tree, sizeCharts] = await Promise.all([getCategoryTreeQuery(), getSizeChartOptionsQuery()]);

  return (
    <AdminPage>
      <CategoryTreeBoard initialTree={tree} sizeCharts={sizeCharts} />
    </AdminPage>
  );
}
