import { notFound } from "next/navigation";
import { SaleEventEditor, getMockSaleEventEditor } from "@/features/admin/modules/sale-events";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminNewSaleEventPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.saleEvents);
  // ?from=<id>: nhân bản — form khởi đầu bằng phạm vi, mức giảm, giá đặt tay của chương trình gốc
  const { from } = await searchParams;
  const data = getMockSaleEventEditor(null, typeof from === "string" ? from : null);
  if (!data) notFound();

  return (
    <AdminPage>
      <SaleEventEditor key={from ?? "new"} data={data} />
    </AdminPage>
  );
}
