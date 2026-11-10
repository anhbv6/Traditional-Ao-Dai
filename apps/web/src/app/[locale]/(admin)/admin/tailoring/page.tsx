import { TailoringBoard, getTailoringBoardQuery } from "@/features/admin/modules/tailoring";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminTailoringPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.tailoring);
  const data = await getTailoringBoardQuery();

  return (
    <AdminPage>
      <TailoringBoard data={data} />
    </AdminPage>
  );
}
