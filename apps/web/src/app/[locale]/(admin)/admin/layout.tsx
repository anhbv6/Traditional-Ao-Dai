"use client";

import React, { ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Shield, LayoutDashboard, LogOut, Globe, User } from "lucide-react";
import Link from "next/link";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const currentLocale = useLocale();

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col font-[family-name:var(--font-lora)]">
      {/* Admin Header */}
      <header className="bg-white border-b border-[#800020]/10 sticky top-0 z-40 select-none shadow-xs">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#800020] text-white">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[#800020] uppercase tracking-wider">
                AODAI Admin
              </h1>
              <p className="text-[10px] text-[#706565] font-semibold tracking-wider uppercase">
                Hệ thống quản lý
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-[#706565]">
            <Link
              href={`/${currentLocale}`}
              className="flex items-center gap-1.5 hover:text-[#800020] transition-colors"
            >
              <Globe size={14} />
              <span>Xem cửa hàng</span>
            </Link>
            <span className="h-4 w-px bg-[#E2D9D2]" />
            <div className="flex items-center gap-2 text-[#2A2525]">
              <div className="grid size-8 place-items-center rounded-full bg-[#FAF7F5] border border-[#800020]/15 text-[#800020]">
                <User size={14} />
              </div>
              <span className="hidden sm:inline">Quản trị viên</span>
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