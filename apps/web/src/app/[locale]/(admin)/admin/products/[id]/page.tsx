import { notFound } from "next/navigation";
import {
  ProductEditor,
  getAdminProductDetailQuery,
  getAdminProductEditorOptionsQuery,
} from "@/features/admin/modules/products";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

/** Màn chi tiết sản phẩm: thông tin sản phẩm, hình thức bán, chất liệu, đặc tính thiết kế, SKU tồn kho */
export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.products);
  const { id } = await params;

  // id không phải uuid thì Prisma báo lỗi kiểu dữ liệu → coi như không tồn tại
  const [product, options] = await Promise.all([
    /^[0-9a-f-]{36}$/i.test(id) ? getAdminProductDetailQuery(id) : null,
    getAdminProductEditorOptionsQuery(),
  ]);
  if (!product || options.categories.length === 0) notFound();

  return (
    <AdminPage>
      <ProductEditor key={product.updatedAt} initialProduct={product} options={options} />
    </AdminPage>
  );
}
