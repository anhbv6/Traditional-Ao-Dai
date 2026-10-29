"use client";

import Image from "next/image";
import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ActionLink, AppTooltip, type ActionColors } from "@/components/shared";
import { HeaderHeightSync } from "@/components/layout/header/HeaderHeightSync";
import { AdminMobileNav } from "./AdminMobileNav";
import { AdminSubNav } from "./AdminSubNav";
import { AdminUserMenu } from "./AdminUserMenu";
import { type AdminHeaderProps } from "../types/header.types";

// Lề ngang trùng với AdminPage để header thẳng hàng nội dung trang
const SHELL_X = "mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12";
// Nút phụ đơn sắc cho ActionLink dùng chung
const GHOST_COLORS: ActionColors = { bg: "#FFFFFF", text: "#3F3F46", border: "#E4E4E7", hover: "#F4F4F5" };

export function AdminHeader({ user, isSuperAdmin, navLinks, isLoggingOut, onOpenProfile, onLogout }: AdminHeaderProps) {
  const t = useTranslations("AdminPage.header");

  return (
    <header className="sticky top-0 z-40 select-none border-b border-[#E4E4E7] bg-white/90 backdrop-blur-md">
      <div className={`${SHELL_X} flex h-14 items-center justify-between gap-3`}>
        <div className="flex min-w-0 items-center gap-2">
          <AdminMobileNav items={navLinks} />

          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2.5">
            <span className="size-8 shrink-0 overflow-hidden rounded-lg border border-[#E4E4E7] bg-white">
              <Image src="/logo.png" alt="" width={64} height={64} priority className="size-full object-contain p-0.5" />
            </span>
            <span className="truncate text-sm font-semibold text-[#09090B]">{t("systemTitle")}</span>
          </Link>

          <span className="hidden rounded-md border border-[#E4E4E7] bg-[#FAFAFA] px-1.5 py-0.5 text-[11px] font-medium text-[#71717A] sm:inline">
            {isSuperAdmin ? t("superAdminRole") : t("staffRole")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AppTooltip content={t("viewStore")}>
            <ActionLink
              href="/"
              target="_blank"
              variant="custom"
              size="sm"
              colors={GHOST_COLORS}
              icon={<Store />}
              aria-label={t("viewStore")}
              className="rounded-lg px-2.5 font-(family-name:--font-admin) text-xs normal-case tracking-normal sm:px-3"
            >
              <span className="hidden sm:inline">{t("viewStore")}</span>
            </ActionLink>
          </AppTooltip>

          <span aria-hidden className="mx-1 h-5 w-px bg-[#E4E4E7]" />

          <AdminUserMenu
            user={user}
            isSuperAdmin={isSuperAdmin}
            isLoggingOut={isLoggingOut}
            onOpenProfile={onOpenProfile}
            onLogout={onLogout}
          />
        </div>
      </div>

      <div className={SHELL_X}>
        <AdminSubNav items={navLinks} />
      </div>

      {/* Đo chiều cao header để thông báo (toast) hiện ngay dưới header */}
      <HeaderHeightSync />
    </header>
  );
}
