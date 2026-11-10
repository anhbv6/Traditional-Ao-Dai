import { CustomersBoard, getAdminCustomersQuery } from "@/features/admin/modules/customers";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_ACTION_ACCESS, ADMIN_MODULE_ACCESS, canAccess } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const user = await requireAdminPage(ADMIN_MODULE_ACCESS.customers);
  // Khóa / mở khóa chỉ Super Admin — chỉ dùng để hiện nút, Server Action vẫn kiểm tra lại
  const data = await getAdminCustomersQuery(canAccess(user, ADMIN_ACTION_ACCESS.toggleCustomerActive));

  return (
    <AdminPage>
      <CustomersBoard data={data} />
    </AdminPage>
  );
}
