import { notFound } from "next/navigation";
import {
  CategoryDetail,
  findCategory,
  getCategoryTreeQuery,
  getSizeChartOptionsQuery,
} from "@/features/admin/modules/categories";
import { getAdminSizeChartDetailQuery } from "@/features/admin/modules/size-charts";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

/** Màn chi tiết (chỉ xem) một loại sản phẩm — thêm / sửa mở dialog ngay trên màn này hoặc trên bảng */
export default async function AdminCategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.categories);
  const { id } = await params;
  const [tree, sizeCharts] = await Promise.all([getCategoryTreeQuery(), getSizeChartOptionsQuery()]);
  const node = findCategory(tree, id);
  if (!node) notFound();

  // Bảng size đang áp dụng: của riêng loại, hoặc thừa hưởng nhóm gốc (cùng quy tắc với bảng danh sách)
  const parent = tree.find((root) => root.id === node.parentId);
  const ownChartId = node.defaultSizeChartId;
  const inheritedChartId = !ownChartId && parent?.group === node.group ? parent.defaultSizeChartId : null;
  const chartId = ownChartId ?? inheritedChartId;
  const chart = chartId ? await getAdminSizeChartDetailQuery(chartId) : null;

  return (
    <AdminPage>
      <CategoryDetail
        node={node}
        roots={tree}
        sizeCharts={sizeCharts}
        sizeChart={chart ? { chart, source: ownChartId ? "own" : "inherited" } : null}
      />
    </AdminPage>
  );
}
