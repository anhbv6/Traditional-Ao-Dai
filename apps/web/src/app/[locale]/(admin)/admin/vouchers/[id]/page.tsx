import { notFound } from "next/navigation";
import { VoucherEditor, getVoucherEditorQuery } from "@/features/admin/modules/vouchers";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminVoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.vouchers);
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const data = await getVoucherEditorQuery(id);
  if (!data) notFound();

  return (
    <AdminPage>
      {/* key: đổi coupon (nhân bản → điều hướng) thì form khởi tạo lại từ dữ liệu mới */}
      <VoucherEditor key={id} data={data} />
    </AdminPage>
  );
}
