"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { type AdminNavListProps } from "../types/header.types";

/** Kiểu một dòng menu — dùng chung cho module và các liên kết phụ của sidebar */
export const ADMIN_NAV_ITEM_CLASS =
  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]/15";

const ITEM_IDLE_CLASS = "text-[#52525B] hover:bg-[#FAFAFA] hover:text-[#09090B]";

/** Danh sách module quản trị — dùng chung cho sidebar desktop và ngăn kéo mobile */
export function AdminNavList({ items, onNavigate, className }: AdminNavListProps) {
  const t = useTranslations("AdminPage.header");

  return (
    <nav aria-label={t("navigation")} className={className}>
      <ul className="space-y-1">
        {items.map(({ href, icon: Icon, label, active }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(ADMIN_NAV_ITEM_CLASS, active ? "bg-[#F4F4F5] text-[#09090B]" : ITEM_IDLE_CLASS)}
            >
              <Icon size={17} strokeWidth={active ? 2.1 : 1.8} className="shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
