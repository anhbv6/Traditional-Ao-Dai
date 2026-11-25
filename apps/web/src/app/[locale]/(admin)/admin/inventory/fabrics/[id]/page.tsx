import { notFound } from "next/navigation";
import { FabricDetail, getAdminFabricRollDetailQuery } from "@/features/admin/modules/fabrics";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminFabricDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.fabrics);
  const { id } = await params;

  // id không phải uuid thì Prisma báo lỗi kiểu dữ liệu → coi như không tồn tại
  const data = /^[0-9a-f-]{36}$/i.test(id) ? await getAdminFabricRollDetailQuery(id) : null;
  if (!data) notFound();

  return (
    <AdminPage>
      <FabricDetail data={data} />
    </AdminPage>
  );
}
