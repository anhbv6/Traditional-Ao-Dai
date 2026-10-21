"use client";

import { useTranslations } from "next-intl";
import { StatusScreen } from "@/components/shared/StatusScreen";

const SUGGESTED_LINKS = [
  { key: "products", href: "/products" },
  { key: "custom", href: "/custom" },
  { key: "about", href: "/about" },
  { key: "faqs", href: "/faqs" },
  { key: "contact", href: "/contact" },
] as const;

/** Nội dung trang 404 của storefront (dịch qua `Common.notFound`) — dùng ở `not-found.tsx` */
export function NotFoundView() {
  const t = useTranslations("Common.notFound");

  return (
    <StatusScreen
      code="404"
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      primaryAction={{ label: t("home"), href: "/" }}
      secondaryAction={{ label: t("shop"), href: "/products" }}
      suggestions={{
        title: t("suggestions"),
        links: SUGGESTED_LINKS.map((link) => ({ label: t(`links.${link.key}`), href: link.href })),
      }}
    />
  );
}
