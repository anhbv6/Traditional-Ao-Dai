"use client";

import Image from "next/image";
import { ExternalLink, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEM_CLASS, AdminNavList } from "./AdminNavList";
import { AdminUserMenu } from "./AdminUserMenu";
import { type AdminNavPanelProps } from "../types/header.types";

/** Đường phân cách nét đứt giữa các nhóm trong thẻ menu */
function PanelDivider() {
  return <div aria-hidden className="mx-4 border-t border-dashed border-[#E4E4E7]" />;
}

/**
 * Nội dung thẻ menu quản trị: logo, module, xem cửa hàng, tài khoản — dùng chung cho sidebar và ngăn kéo mobile.
 * Danh sách module tự cuộn để nút tài khoản luôn nằm trong tầm nhìn.
 */
export function AdminNavPanel({
  user,
  isSuperAdmin,
  navLinks,
  isLoggingOut,
  onOpenProfile,
  onLogout,
  onNavigate,
  accountVariant = "sidebar",
}: AdminNavPanelProps) {
  const t = useTranslations("AdminPage.header");

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#E4E4E7] bg-white shadow-[0_12px_32px_-20px_rgba(9,9,11,0.18)]">
      <Link href="/admin/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-4 py-4 outline-none">
        <span className="size-10 shrink-0 overflow-hidden rounded-xl bg-white">
          <Image src="/logo.png" alt="" width={64} height={64} priority className="size-full object-contain p-0.5" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold text-[#09090B]">{t("systemTitle")}</span>
          <span className="block truncate text-xs text-[#71717A]">
            {isSuperAdmin ? t("superAdminRole") : t("staffRole")}
          </span>
        </span>
      </Link>

      <PanelDivider />

      <AdminNavList
        items={navLinks}
        onNavigate={onNavigate}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin]"
      />

      <PanelDivider />

      <div className="px-3 py-3">
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className={cn(ADMIN_NAV_ITEM_CLASS, "text-[#52525B] hover:bg-[#FAFAFA] hover:text-[#09090B]")}
        >
          <Store size={17} strokeWidth={1.8} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{t("viewStore")}</span>
          <ExternalLink size={14} aria-hidden className="shrink-0 text-[#A1A1AA]" />
        </Link>
      </div>

      {/* Từ xl khối tài khoản lên góc trên phải (AdminRightRail); ngăn kéo mobile luôn giữ */}
      <div className={cn(accountVariant === "sidebar" && "xl:hidden")}>
        <PanelDivider />
        <div className="p-2">
          <AdminUserMenu
            variant={accountVariant}
            user={user}
            isSuperAdmin={isSuperAdmin}
            isLoggingOut={isLoggingOut}
            onOpenProfile={onOpenProfile}
            onLogout={onLogout}
          />
        </div>
      </div>
    </div>
  );
}
