import { AttributesBoard, getAdminAttributeDataQuery } from "@/features/admin/modules/attributes";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminAttributesPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.attributes);
  const data = await getAdminAttributeDataQuery();

  return (
    <AdminPage>
      <AttributesBoard initialData={data} />
    </AdminPage>
  );
}
