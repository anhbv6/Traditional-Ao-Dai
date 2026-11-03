import { CollectionsBoard, getAdminCollectionsQuery } from "@/features/admin/modules/collections";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.collections);
  const collections = await getAdminCollectionsQuery();

  return (
    <AdminPage>
      <CollectionsBoard initialCollections={collections} />
    </AdminPage>
  );
}
