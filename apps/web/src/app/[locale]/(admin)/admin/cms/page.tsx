import React from "react";
import { FileText } from "lucide-react";
import { getCmsArticlesAndFaqsQuery, CmsManager } from "@/features/admin/modules/cms";
import { getTranslations } from "next-intl/server";
import { requireAdminPage } from "@/features/admin/core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/core/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/core/ui";

export const dynamic = "force-dynamic";

export default async function AdminCmsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.cms);
  const t = await getTranslations("AdminPage.pages.cms");

  const { articles, faqs } = await getCmsArticlesAndFaqsQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={FileText}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        meta={t.rich("meta", { articles: articles.length, faqs: faqs.length, value: (chunks) => <AdminMetaValue>{chunks}</AdminMetaValue> })}
      />

      <CmsManager initialArticles={articles} initialFaqs={faqs} />
    </AdminPage>
  );
}
