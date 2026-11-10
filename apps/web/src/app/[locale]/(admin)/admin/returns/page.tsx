import { ReturnsDesk, getMockReturnsDesk } from "@/features/admin/modules/returns";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.returns);
  // Dữ liệu mock — chưa có module hậu mãi ở Backend (xem returns.mock.ts)
  const data = getMockReturnsDesk();

  return (
    <AdminPage>
      <ReturnsDesk data={data} />
    </AdminPage>
  );
}
