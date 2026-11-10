import { notFound } from "next/navigation";
import { StaffDetail, getStaffDetailQuery } from "@/features/admin/modules/staff";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminStaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminPage(ADMIN_MODULE_ACCESS.staff);
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const data = await getStaffDetailQuery(id);
  if (!data) notFound();

  return (
    <AdminPage>
      <StaffDetail data={data} isSelf={user.id === data.id} />
    </AdminPage>
  );
}
