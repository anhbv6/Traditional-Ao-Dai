"use client";

import React, { ReactNode } from "react";
import { useLocale } from "next-intl";
import { Shield, Globe, User, LayoutDashboard, UserCheck, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";
import { useAuthStore } from "@/features/auth/store/authStore";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isLoginPage = pathname?.includes("/admin/login");

  if (isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)] text-[#09090B] antialiased">
        {children}
      </div>
    );
  }

  const isSuperAdmin = user?.role === "ADMIN";

  const navLinks = [
    {
      label: "Tổng quan",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: pathname?.includes("/admin/dashboard"),
    },
    {
      label: "Phê duyệt yêu cầu",
      href: "/admin/approvals",
      icon: UserCheck,
      active: pathname?.includes("/admin/approvals"),
    },
    ...(isSuperAdmin
      ? [
          {
            label: "Quản lý nhân sự",
            href: "/admin/staff",
            icon: Users,
            active: pathname?.includes("/admin/staff"),
          },
        ]
      : []),
  ];

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-[family-name:var(--font-geist-sans)] text-[#09090B] antialiased">
        {/* Admin Header */}
        <header className="bg-white border-b border-[#E4E4E7] sticky top-0 z-40 select-none">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="flex items-center gap-3">
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
              </Link>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-zinc-200">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        item.active
                          ? "bg-zinc-900 text-white shadow-2xs"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-[#71717A]">
              <Link
                href="/"
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
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-semibold text-xs leading-tight">
                    {user?.name || user?.email || "Quản trị viên"}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {isSuperAdmin ? "Super Admin" : "Nhân viên (Staff)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation sub-header */}
        <div className="md:hidden bg-white border-b border-zinc-200 px-4 py-2 flex items-center gap-1 overflow-x-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  item.active
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
