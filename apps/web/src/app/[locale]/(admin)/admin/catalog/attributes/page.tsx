import { AttributesBoard, getAdminAttributesQuery } from "@/features/admin/modules/attributes";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminAttributesPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.attributes);
  const values = await getAdminAttributesQuery();

  return (
    <AdminPage>
      <AttributesBoard initialValues={values} />
    </AdminPage>
  );
}
