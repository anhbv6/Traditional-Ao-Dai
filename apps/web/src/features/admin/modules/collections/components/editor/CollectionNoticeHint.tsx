"use client";

import { useTranslations } from "next-intl";
import { AdminNoticeHint, type AdminNotice } from "@/features/admin/core/ui";

export type CollectionNotice = AdminNotice;

/**
 * Icon ⓘ ở góc thẻ "Vòng đời" thay cho khối "Cần chú ý": màu theo mức nặng nhất
 * (xám = ổn · hổ phách = còn thiếu dữ liệu · đỏ hồng = có cảnh báo), rê chuột / focus / chạm để xem danh sách.
 */
export function CollectionNoticeHint({ notices }: { notices: CollectionNotice[] }) {
  const t = useTranslations("AdminPage.collections");

  return (
    <AdminNoticeHint
      notices={notices}
      title={t("editor.sections.warnings")}
      emptyText={t("warnings.none")}
      ariaLabel={t("editor.sections.warnings")}
    />
  );
}
