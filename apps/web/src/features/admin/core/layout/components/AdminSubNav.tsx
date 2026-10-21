"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { type AdminSubNavProps } from "../types/header.types";

/** Thanh tab điều hướng module (desktop) — tab đang mở có gạch chân đen */
export function AdminSubNav({ items }: AdminSubNavProps) {
  const t = useTranslations("AdminPage.header");

  return (
    <nav
      aria-label={t("navigation")}
      className="hidden overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)] [scrollbar-width:none] lg:block [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex items-center gap-1 pr-8">
        {items.map(({ href, icon: Icon, label, active }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-2 whitespace-nowrap rounded-t-lg px-3 text-[13px] font-medium transition-colors",
                "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
                active
                  ? "text-[#09090B] after:bg-[#09090B]"
                  : "text-[#71717A] after:bg-transparent hover:text-[#09090B] hover:after:bg-[#E4E4E7]"
              )}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
