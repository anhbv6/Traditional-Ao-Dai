"use client";

import { ChevronDown, ChevronsUpDown, LogOut, Store, UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type AdminUserMenuProps } from "../types/header.types";

const TRIGGER_FOCUS_CLASS =
  "cursor-pointer outline-none transition-colors hover:bg-[#F4F4F5] focus-visible:ring-2 focus-visible:ring-[#18181B]/15 data-popup-open:bg-[#F4F4F5]";

export function AdminUserMenu({
  user,
  isSuperAdmin,
  isLoggingOut,
  onOpenProfile,
  onLogout,
  variant = "header",
}: AdminUserMenuProps) {
  const t = useTranslations("AdminPage.header");

  const displayName = user?.name || user?.email || t("defaultAdminName");
  const displayRole = isSuperAdmin ? t("superAdminRole") : t("staffRole");
  const initial = displayName.charAt(0).toUpperCase();

  const items: AppMenuEntry[] = [
    { key: "profile", label: t("editProfile"), icon: UserCog, onSelect: onOpenProfile },
    { key: "store", label: t("backToStore"), icon: Store, href: "/" },
    { type: "separator", key: "sep" },
    {
      key: "logout",
      label: isLoggingOut ? t("loggingOut") : t("logout"),
      icon: LogOut,
      tone: "danger",
      disabled: isLoggingOut,
      onSelect: onLogout,
    },
  ];

  const isSidebar = variant === "sidebar";

  // Ngăn kéo vaul khóa pointer-events của phần còn lại, menu portal ra body không bấm được → hiện thao tác trực tiếp
  if (variant === "drawer") {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t("editProfile")}
          onClick={onOpenProfile}
          className={`${TRIGGER_FOCUS_CLASS} flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left`}
        >
          <UserAvatar src={user?.avatarUrl} alt={displayName} initial={initial} className="size-9" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-semibold text-[#09090B]">{displayName}</span>
            <span className="block truncate text-xs text-[#71717A]">{user?.email || displayRole}</span>
          </span>
        </button>
        <button
          type="button"
          aria-label={isLoggingOut ? t("loggingOut") : t("logout")}
          disabled={isLoggingOut}
          onClick={onLogout}
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-[#71717A] outline-none transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-[#18181B]/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={17} strokeWidth={1.8} />
        </button>
      </div>
    );
  }

  return (
    <AppMenu
      tone="admin"
      width={isSidebar ? "trigger" : 240}
      // Nút tài khoản nằm đáy sidebar → menu mở lên trên
      side={isSidebar ? "top" : undefined}
      sideOffset={8}
      items={items}
      header={
        <div className="flex items-center gap-3">
          <UserAvatar src={user?.avatarUrl} alt={displayName} initial={initial} className="size-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#09090B]">{displayName}</p>
            <p className="truncate text-xs text-[#71717A]">{user?.email || "—"}</p>
          </div>
        </div>
      }
      trigger={
        isSidebar ? (
          <button
            type="button"
            aria-label={t("accountMenu")}
            className={`${TRIGGER_FOCUS_CLASS} flex w-full items-center gap-3 rounded-xl p-2 text-left`}
          >
            <UserAvatar src={user?.avatarUrl} alt={displayName} initial={initial} className="size-9" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-semibold text-[#09090B]">{displayName}</span>
              <span className="block truncate text-xs text-[#71717A]">{user?.email || displayRole}</span>
            </span>
            <ChevronsUpDown size={14} className="shrink-0 text-[#A1A1AA]" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={t("accountMenu")}
            className={`${TRIGGER_FOCUS_CLASS} flex items-center gap-2.5 rounded-full p-1 md:rounded-xl md:pr-2`}
          >
            <UserAvatar src={user?.avatarUrl} alt={displayName} initial={initial} className="size-8" />
            <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
              <span className="max-w-[140px] truncate text-[13px] font-semibold text-[#09090B]">{displayName}</span>
              <span className="text-[11px] text-[#71717A]">{displayRole}</span>
            </span>
            <ChevronDown size={14} className="hidden text-[#A1A1AA] md:block" />
          </button>
        )
      }
    />
  );
}

function UserAvatar({ src, alt, initial, className }: { src?: string | null; alt: string; initial: string; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarImage src={src ?? undefined} alt={alt} />
      <AvatarFallback className="bg-[#18181B] text-xs font-semibold text-white">{initial}</AvatarFallback>
    </Avatar>
  );
}
