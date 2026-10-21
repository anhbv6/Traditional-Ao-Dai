"use client";

import { useTranslations } from "next-intl";
import { StatusScreen } from "@/components/shared/StatusScreen";

/** Gợi ý quay lại mua sắm — dùng chung nhãn với trang 404 (`Common.notFound.links`) */
const SUGGESTED_LINKS = [
  { key: "products", href: "/products" },
  { key: "custom", href: "/custom" },
  { key: "about", href: "/about" },
] as const;

/**
 * Nội dung trang 403 (dịch qua `Common.forbidden`): khách hàng đã đăng nhập cố vào khu quản trị
 * → mời quay lại mua sắm, hoặc đăng nhập bằng tài khoản quản trị nếu là nhân viên.
 */
export function ForbiddenView() {
  const t = useTranslations("Common");

  return (
    <StatusScreen
      code="403"
      eyebrow={t("forbidden.eyebrow")}
      title={t("forbidden.title")}
      description={t("forbidden.description")}
      primaryAction={{ label: t("forbidden.home"), href: "/" }}
      secondaryAction={{ label: t("forbidden.adminLogin"), href: "/admin/login" }}
      suggestions={{
        title: t("forbidden.suggestions"),
        links: SUGGESTED_LINKS.map((link) => ({ label: t(`notFound.links.${link.key}`), href: link.href })),
      }}
    />
  );
}
