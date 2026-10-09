import React from "react";
import { FileText } from "lucide-react";
import { getCmsArticlesAndFaqsQuery, CmsManager } from "@/features/admin/cms";
import { requireAdminPage } from "@/features/admin/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "@/features/admin/session/permissions";
import { AdminMetaValue, AdminPage, AdminPageHeader } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminCmsPage() {
  await requireAdminPage(ADMIN_MODULE_ACCESS.cms);

  const { articles, faqs } = await getCmsArticlesAndFaqsQuery();

  return (
    <AdminPage>
      <AdminPageHeader
        icon={FileText}
        eyebrow="Nội dung & Hướng dẫn"
        title="Quản Trị Tin Tức & FAQs"
        description="Bật/tắt xuất bản bài viết và câu hỏi thường gặp hiển thị trên cửa hàng."
        meta={<><AdminMetaValue>{articles.length}</AdminMetaValue> bài viết • <AdminMetaValue>{faqs.length}</AdminMetaValue> câu hỏi</>}
      />

      <CmsManager initialArticles={articles} initialFaqs={faqs} />
    </AdminPage>
  );
}
