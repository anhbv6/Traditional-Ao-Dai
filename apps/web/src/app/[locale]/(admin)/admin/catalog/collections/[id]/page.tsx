import { notFound } from "next/navigation";
import {
  CollectionEditor,
  getAdminCollectionDetailQuery,
  getCollectionPickerProductsQuery,
  getHomepageCollectionUsageQuery,
} from "@/features/admin/modules/collections";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminCollectionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.collections);
  const { id } = await params;

  // id không phải uuid thì Prisma báo lỗi kiểu dữ liệu → coi như không tồn tại
  const collection = /^[0-9a-f-]{36}$/i.test(id) ? await getAdminCollectionDetailQuery(id) : null;
  if (!collection) notFound();

  const [products, homepageUsedByOthers] = await Promise.all([
    getCollectionPickerProductsQuery(),
    getHomepageCollectionUsageQuery(collection.id),
  ]);

  return (
    <AdminPage>
      <CollectionEditor collection={collection} products={products} homepageUsedByOthers={homepageUsedByOthers} />
    </AdminPage>
  );
}
