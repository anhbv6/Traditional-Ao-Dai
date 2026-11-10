import { CmsBoard, getCmsBoardQuery } from "@/features/admin/modules/cms";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminCmsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.cms);
  const { tab } = await searchParams;
  const data = await getCmsBoardQuery();

  return (
    <AdminPage>
      <CmsBoard data={data} initialTab={tab === "faqs" ? "faqs" : "articles"} />
    </AdminPage>
  );
}
