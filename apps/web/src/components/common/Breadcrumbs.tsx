"use client";

import React from "react";
import { usePathname, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbsProps {
  lastLabel?: string;
  className?: string;
}

export function Breadcrumbs({ lastLabel, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();
  const t = useTranslations("Breadcrumbs");

  // Cắt nhỏ đường dẫn (ví dụ: "/products/ao-dai-nhung" -> ["products", "ao-dai-nhung"])
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb className={`mb-6 select-none ${className}`}>
      <BreadcrumbList className="text-[#706565]">
        {/* Trang chủ */}
        <BreadcrumbItem>
          <BreadcrumbLink 
            render={<Link href="/" />}
            className="text-[#706565] transition-colors hover:text-[#800020]"
          >
            {t("home")}
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          // Xác định nhãn hiển thị cho segment này
          let label = "";
          if (isLast && lastLabel) {
            label = lastLabel;
          } else if (t.has(segment)) {
            label = t(segment);
          } else {
            // Định dạng slug (ví dụ: "ao-dai-nhung" -> "Ao Dai Nhung")
            label = segment
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
          }

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator className="text-[#706565]/40" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-semibold text-[#2A2525]">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink 
                    render={<Link href={href as any} />}
                    className="text-[#706565] transition-colors hover:text-[#800020]"
                  >
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
