import { ShippingPaymentBoard, getMockShippingPayment } from "@/features/admin/modules/shipping-payment";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminShippingPaymentPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.shippingPayment);
  // Dữ liệu mock — chưa có bảng cấu hình (xem shippingPayment.mock.ts)
  const data = getMockShippingPayment();

  return (
    <AdminPage>
      <ShippingPaymentBoard data={data} />
    </AdminPage>
  );
}
