import React from "react";
import { Scissors } from "lucide-react";
import { getTailoringItemsQuery, TailoringBoard } from "@/features/admin/modules/tailoring";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminTailoringPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.tailoring);

  const tailoringItems = await getTailoringItemsQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={Scissors}
        eyebrow="Xưởng may đo thủ công"
        title="Tiến Độ May Đo Áo Dài"
        description="Cập nhật từng công đoạn may theo số đo riêng và ghi nhật ký thợ phụ trách."
        meta={<>Đang may <AdminMetaValue>{tailoringItems.length}</AdminMetaValue> áo theo số đo riêng</>}
      />

      <TailoringBoard initialItems={tailoringItems} />
    </AdminPage>
  );
}
