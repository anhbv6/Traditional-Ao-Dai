import { notFound } from "next/navigation";
import { MaterialEditor, getAdminMaterialDetailQuery } from "@/features/admin/modules/materials";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminMaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.materials);
  const { id } = await params;

  // id không phải uuid thì Prisma báo lỗi kiểu dữ liệu → coi như không tồn tại
  const material = /^[0-9a-f-]{36}$/i.test(id) ? await getAdminMaterialDetailQuery(id) : null;
  if (!material) notFound();

  return (
    <AdminPage>
      <MaterialEditor key={material.updatedAt} initialMaterial={material} />
    </AdminPage>
  );
}
