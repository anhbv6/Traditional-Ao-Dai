import React from "react";
import { Users } from "lucide-react";
import { getAdminCustomersQuery, CustomersList } from "@/features/admin/customers";
import { requireAdminPage } from "@/features/admin/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.customers);

  const customers = await getAdminCustomersQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Users}
        eyebrow="Dữ liệu khách hàng CRM"
        title="Khách Hàng & Số Đo May Riêng"
        description="Tra cứu thông tin liên hệ, lịch sử mua và hồ sơ số đo của khách hàng."
        meta={<>Tổng số <AdminMetaValue>{customers.length}</AdminMetaValue> khách hàng đã đăng ký</>}
      />

      <CustomersList initialCustomers={customers} />
    </AdminPage>
  );
}
