import { notFound } from "next/navigation";
import { SizeChartEditor, getAdminSizeChartDetailQuery } from "@/features/admin/modules/size-charts";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminSizeChartEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.sizeCharts);
  const { id } = await params;

  // id không phải uuid thì Prisma báo lỗi kiểu dữ liệu → coi như không tồn tại
  const chart = /^[0-9a-f-]{36}$/i.test(id) ? await getAdminSizeChartDetailQuery(id) : null;
  if (!chart) notFound();

  return (
    <AdminPage>
      <SizeChartEditor key={chart.updatedAt} initialChart={chart} />
    </AdminPage>
  );
}
