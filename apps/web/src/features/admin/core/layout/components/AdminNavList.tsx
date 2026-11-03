"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { type AdminNavGroup, type AdminNavLink, type AdminNavListProps } from "../types/header.types";

/** Kiểu một dòng menu — dùng chung cho module và các liên kết phụ của sidebar */
export const ADMIN_NAV_ITEM_CLASS =
  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]/15";

const ITEM_IDLE_CLASS = "text-[#52525B] hover:bg-[#FAFAFA] hover:text-[#09090B]";
const ITEM_ACTIVE_CLASS = "bg-[#F4F4F5] text-[#09090B]";

function NavLink({ item, onNavigate, nested }: { item: AdminNavLink; onNavigate?: () => void; nested?: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={item.active ? "page" : undefined}
      className={cn(
        nested
          ? "flex h-9 items-center rounded-lg px-3 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#18181B]/15"
          : ADMIN_NAV_ITEM_CLASS,
        item.active ? ITEM_ACTIVE_CLASS : ITEM_IDLE_CLASS
      )}
    >
      {Icon && <Icon size={17} strokeWidth={item.active ? 2.1 : 1.8} className="shrink-0" />}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroup({
  group,
  open,
  onToggle,
  onNavigate,
}: {
  group: AdminNavGroup;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const Icon = group.icon;
  const listId = `admin-nav-${group.key}`;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
        className={cn(
          ADMIN_NAV_ITEM_CLASS,
          "w-full cursor-pointer",
          group.active ? "text-[#09090B] hover:bg-[#FAFAFA]" : ITEM_IDLE_CLASS
        )}
      >
        <Icon size={17} strokeWidth={group.active ? 2.1 : 1.8} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
        <ChevronDown
          size={15}
          aria-hidden
          className={cn("shrink-0 text-[#A1A1AA] transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul id={listId} className="mb-1 ml-[22px] mt-0.5 space-y-0.5 border-l border-[#E4E4E7] pl-2.5">
          {group.children.map((child) => (
            <li key={child.key}>
              <NavLink item={child} onNavigate={onNavigate} nested />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Danh sách module quản trị — dùng chung cho sidebar desktop và ngăn kéo mobile */
export function AdminNavList({ items, onNavigate, className }: AdminNavListProps) {
  const t = useTranslations("AdminPage.header");
  // Chỉ lưu nhóm người dùng đã tự bấm mở/đóng; nhóm chưa bấm thì mở theo trang đang xem
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label={t("navigation")} className={className}>
      <ul className="space-y-1">
        {items.map((entry) => (
          <li key={entry.key}>
            {entry.type === "link" ? (
              <NavLink item={entry} onNavigate={onNavigate} />
            ) : (
              <NavGroup
                group={entry}
                open={toggled[entry.key] ?? entry.active}
                onToggle={() => setToggled((prev) => ({ ...prev, [entry.key]: !(prev[entry.key] ?? entry.active) }))}
                onNavigate={onNavigate}
              />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
