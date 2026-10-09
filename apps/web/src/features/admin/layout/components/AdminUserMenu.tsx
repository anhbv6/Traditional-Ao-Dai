"use client";

import React from "react";
import { ChevronDown, UserCog, Store, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { type AdminUserMenuProps } from "../types";

export function AdminUserMenu({
  user,
  isSuperAdmin,
  isLoggingOut,
  onOpenProfile,
  onLogout,
}: AdminUserMenuProps) {
  const router = useRouter();
  const t = useTranslations("AdminPage.header");

  const displayName = user?.name || user?.email || t("defaultAdminName");
  const displayRole = isSuperAdmin ? t("superAdminRole") : t("staffRole");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-zinc-100 transition-all border border-[#E4E4E7] bg-white cursor-pointer select-none outline-none shadow-2xs">
        <div className="size-7 rounded-full overflow-hidden border border-[#E4E4E7] bg-[#18181B] text-white flex items-center justify-center font-bold text-xs">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
            <img
              src={user.avatar}
              alt={displayName}
              className="size-full object-cover"
            />
          ) : (
            <span>{(user?.name || user?.email || "A")[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="font-semibold text-xs leading-tight text-[#09090B] max-w-[120px] truncate">
            {displayName}
          </span>
          <span className="text-[10px] text-[#71717A] font-medium">
            {displayRole}
          </span>
        </div>
        <ChevronDown size={13} className="text-zinc-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="admin-shell w-56 p-1.5 shadow-lg rounded-xl border border-[#E4E4E7] bg-white"
      >
        <div className="px-3 py-2 border-b border-zinc-100">
          <p className="font-semibold text-xs text-[#09090B] truncate">
            {displayName}
          </p>
          <p className="text-[11px] text-[#71717A] truncate">{user?.email || "—"}</p>
          <span className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] font-semibold text-zinc-700">
            {displayRole}
          </span>
        </div>

        <DropdownMenuItem
          onClick={onOpenProfile}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors mt-1"
        >
          <UserCog size={14} className="text-[#71717A]" />
          <span>{t("editProfile")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
        >
          <Store size={14} className="text-[#71717A]" />
          <span>{t("backToStore")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 border-zinc-100" />

        <DropdownMenuItem
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors disabled:opacity-60"
        >
          {isLoggingOut ? (
            <>
              <Spinner className="size-3.5 text-rose-600" />
              <span>{t("loggingOut")}</span>
            </>
          ) : (
            <>
              <LogOut size={14} className="text-rose-500" />
              <span>{t("logout")}</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
