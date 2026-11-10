import { FabricsBoard, getMockFabricStock } from "@/features/admin/modules/fabrics";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminFabricsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.fabrics);
  // Dữ liệu mock — đang dựng giao diện trước, sau thay bằng query Prisma (xem fabrics.mock.ts)
  const data = getMockFabricStock();

  return (
    <AdminPage>
      <FabricsBoard data={data} />
    </AdminPage>
  );
}
