import { notFound } from "next/navigation";
import { SaleEventEditor, getMockSaleEventEditor } from "@/features/admin/modules/sale-events";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminSaleEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.saleEvents);
  const { id } = await params;
  // Dữ liệu mock — id dạng "s-..." (khi nối DB đổi sang kiểm tra UUID như các màn khác)
  const data = getMockSaleEventEditor(id);
  if (!data) notFound();

  return (
    <AdminPage>
      <SaleEventEditor key={id} data={data} />
    </AdminPage>
  );
}
