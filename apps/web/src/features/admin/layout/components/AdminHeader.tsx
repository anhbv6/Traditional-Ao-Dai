"use client";

import React from "react";
import { Shield, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { AdminUserMenu } from "./AdminUserMenu";
import { AdminSubNav } from "./AdminSubNav";
import { type AdminHeaderProps } from "../types";

export function AdminHeader({
  user,
  isSuperAdmin,
  navLinks,
  isLoggingOut,
  onOpenProfile,
  onLogout,
}: AdminHeaderProps) {
  const t = useTranslations("AdminPage.header");

  return (
    <header className="bg-white border-b border-[#E4E4E7] sticky top-0 z-40 select-none">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Brand Logo & Tiêu đề hệ thống */}
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-[#09090B] text-white">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-[#09090B] uppercase tracking-wider">
              {t("systemTitle")}
            </h1>
            <p className="text-[10px] text-[#71717A] font-medium tracking-wider uppercase">
              {t("systemSubtitle")}
            </p>
          </div>
        </Link>

        {/* Action Buttons & Profile Menu */}
        <div className="flex items-center gap-3 text-xs font-medium">
          {/* Nút về trang khách hàng (Client store) */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-all border border-zinc-200/80 bg-white shadow-2xs"
            title={t("viewStore")}
          >
            <Store size={14} className="text-zinc-600" />
            <span className="hidden sm:inline">{t("viewStore")}</span>
          </Link>

          <span className="h-4 w-px bg-zinc-200" />

          {/* Menu tài khoản quản trị viên */}
          <AdminUserMenu
            user={user}
            isSuperAdmin={isSuperAdmin}
            isLoggingOut={isLoggingOut}
            onOpenProfile={onOpenProfile}
            onLogout={onLogout}
          />
        </div>
      </div>

      {/* Sub-bar thanh điều hướng danh mục quản trị */}
      <AdminSubNav items={navLinks} />
    </header>
  );
}
