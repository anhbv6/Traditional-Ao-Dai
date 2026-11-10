import { notFound } from "next/navigation";
import { ArticleEditor, getArticleEditorQuery } from "@/features/admin/modules/cms";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminPage } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminNewArticlePage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.cms);
  const data = await getArticleEditorQuery(null);
  if (!data) notFound();

  return (
    <AdminPage>
      <ArticleEditor data={data} />
    </AdminPage>
  );
}
