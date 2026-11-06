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

  // Bảng size gắn ở loại sản phẩm (nhóm gốc không có bảng size)
  const chart =
    node.parentId && node.defaultSizeChartId ? await getAdminSizeChartDetailQuery(node.defaultSizeChartId) : null;

  return (
    <AdminPage>
      <CategoryDetail
        node={node}
        roots={tree}
        sizeCharts={sizeCharts}
        sizeChart={chart}
      />
    </AdminPage>
  );
}
