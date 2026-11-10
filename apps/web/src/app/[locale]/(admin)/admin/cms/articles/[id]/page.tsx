import { notFound } from "next/navigation";
import { ArticleEditor, getArticleEditorQuery } from "@/features/admin/modules/cms";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS.cms);
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const data = await getArticleEditorQuery(id);
  if (!data) notFound();

  return (
    <AdminPage>
      {/* key: nhân bản / tạo mới điều hướng sang bài khác thì form khởi tạo lại */}
      <ArticleEditor key={id} data={data} />
    </AdminPage>
  );
}
