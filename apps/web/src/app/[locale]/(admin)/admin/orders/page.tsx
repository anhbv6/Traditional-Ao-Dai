import React from "react";
import { ShoppingBag } from "lucide-react";
import { getAdminOrdersListQuery, OrdersList } from "@/features/admin/orders";
import { requireAdminPage } from "@/features/admin/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.orders);

  const orders = await getAdminOrdersListQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={ShoppingBag}
        eyebrow="Quản lý bán hàng"
        title="Đơn Hàng Áo Dài"
        description="Cập nhật trạng thái xử lý, thanh toán và theo dõi đơn may sẵn / may đo."
        meta={<>Tổng số <AdminMetaValue>{orders.length}</AdminMetaValue> đơn hàng</>}
      />

      <OrdersList initialOrders={orders} />
    </AdminPage>
  );
}
