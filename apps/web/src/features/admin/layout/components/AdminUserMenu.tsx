"use client";

import { ChevronDown, LogOut, Store, UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type AdminUserMenuProps } from "../types";

export function AdminUserMenu({ user, isSuperAdmin, isLoggingOut, onOpenProfile, onLogout }: AdminUserMenuProps) {
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

  return (
    <AppMenu
      tone="admin"
      width={240}
      sideOffset={8}
      items={items}
      header={
        <div className="flex items-center gap-3">
          <UserAvatar src={user?.avatar} alt={displayName} initial={initial} className="size-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#09090B]">{displayName}</p>
            <p className="truncate text-xs text-[#71717A]">{user?.email || "—"}</p>
          </div>
        </div>
      }
      trigger={
        <button
          type="button"
          aria-label={t("accountMenu")}
          className="flex cursor-pointer items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 outline-none transition-colors hover:bg-[#F4F4F5] focus-visible:ring-2 focus-visible:ring-[#18181B]/15 data-popup-open:bg-[#F4F4F5]"
        >
          <UserAvatar src={user?.avatar} alt={displayName} initial={initial} className="size-8" />
          <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
            <span className="max-w-[140px] truncate text-[13px] font-semibold text-[#09090B]">{displayName}</span>
            <span className="text-[11px] text-[#71717A]">{displayRole}</span>
          </span>
          <ChevronDown size={14} className="text-[#A1A1AA]" />
        </button>
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
