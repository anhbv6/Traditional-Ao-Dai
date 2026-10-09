import React from "react";
import { Ticket } from "lucide-react";
import { getAdminVouchersQuery, VouchersList } from "@/features/admin/vouchers";
import { requireAdminPage } from "@/features/admin/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminVouchersPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.vouchers);

  const vouchers = await getAdminVouchersQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Ticket}
        eyebrow="Marketing & Khuyến mãi"
        title="Mã Giảm Giá (Vouchers)"
        description="Bật/tắt hiệu lực mã giảm giá và theo dõi số lượt đã sử dụng."
        meta={<>Tổng cộng <AdminMetaValue>{vouchers.length}</AdminMetaValue> mã khuyến mãi</>}
      />

      <VouchersList initialVouchers={vouchers} />
    </AdminPage>
  );
}
