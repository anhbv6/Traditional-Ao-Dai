"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { HeaderHeightSync } from "@/components/layout/header/HeaderHeightSync";
import { AdminMobileNav } from "./AdminMobileNav";
import { AdminUserMenu } from "./AdminUserMenu";
import { type AdminHeaderProps } from "../types/header.types";

/** Thanh trên của màn nhỏ: chỉ giữ menu, logo, tài khoản — các liên kết khác nằm trong ngăn kéo. Từ `lg` dùng AdminSidebar */
export function AdminHeader(props: AdminHeaderProps) {
  const t = useTranslations("AdminPage.header");
  const { user, isSuperAdmin, isLoggingOut, onOpenProfile, onLogout } = props;

  return (
    <header className="sticky top-0 z-40 select-none border-b border-[#E4E4E7] bg-white/90 backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center justify-between gap-2 pl-2 pr-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1.5">
          <AdminMobileNav {...props} />

          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2">
            <Image src="/logo.png" alt="" width={64} height={64} priority className="size-7 shrink-0 object-contain" />
            <span className="truncate text-sm font-semibold text-[#09090B]">{t("systemTitle")}</span>
          </Link>
        </div>

        <AdminUserMenu
          user={user}
          isSuperAdmin={isSuperAdmin}
          isLoggingOut={isLoggingOut}
          onOpenProfile={onOpenProfile}
          onLogout={onLogout}
        />
      </div>

      {/* Đo chiều cao header để thông báo (toast) hiện ngay dưới header; header ẩn ở desktop thì đo được 0 → toast sát góc trên */}
      <HeaderHeightSync />
    </header>
  );
}
