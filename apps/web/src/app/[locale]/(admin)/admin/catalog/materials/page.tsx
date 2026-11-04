import { MaterialsBoard, getAdminMaterialsQuery } from "@/features/admin/modules/materials";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminMaterialsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.materials);
  const materials = await getAdminMaterialsQuery();

  return (
    <AdminPage>
      <MaterialsBoard materials={materials} />
    </AdminPage>
  );
}
