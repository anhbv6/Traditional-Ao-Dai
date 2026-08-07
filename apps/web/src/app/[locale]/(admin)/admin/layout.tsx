"use client";

import React, { ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Shield, LayoutDashboard, LogOut, Globe, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const isLoginPage = pathname?.includes("/admin/login");

  if (isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)] text-[#09090B] antialiased">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-[family-name:var(--font-geist-sans)] text-[#09090B] antialiased">
      {/* Admin Header */}
      <header className="bg-white border-b border-[#E4E4E7] sticky top-0 z-40 select-none">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#09090B] text-white">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-[#09090B] uppercase tracking-wider">
                AODAI Admin
              </h1>
              <p className="text-[10px] text-[#71717A] font-medium tracking-wider uppercase">
                Hệ thống quản lý
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-[#71717A]">
            <Link
              href={`/${currentLocale}`}
              className="flex items-center gap-1.5 hover:text-[#09090B] transition-colors"
            >
              <Globe size={14} />
              <span>Xem cửa hàng</span>
            </Link>
            <span className="h-4 w-px bg-[#E4E4E7]" />
            <div className="flex items-center gap-2 text-[#09090B]">
              <div className="grid size-8 place-items-center rounded-full bg-[#FAFAFA] border border-[#E4E4E7] text-[#09090B]">
                <User size={14} />
              </div>
              <span className="hidden sm:inline font-semibold">Quản trị viên</span>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}