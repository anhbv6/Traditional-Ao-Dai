"use client";

import React, { ReactNode } from "react";
import { Geist } from "next/font/google";
import { useLocale } from "next-intl";
import {
  Shield,
  Globe,
  User,
  LayoutDashboard,
  ShoppingBag,
  Scissors,
  Shirt,
  Boxes,
  Users,
  UserCheck,
  Ticket,
  FileText,
  LogOut,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { adminLogoutApi } from "@/features/admin/login";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isLoginPage = pathname?.includes("/admin/login");

  if (isLoginPage) {
    return (
      <div className={`${geistSans.variable} min-h-screen flex flex-col font-geist text-[#09090B] antialiased`}>
        {children}
      </div>
    );
  }

  const isSuperAdmin = user?.role === "ADMIN";

  // Menu điều hướng được phân bổ chuẩn theo Staff vs Super Admin
  const navLinks = [
    {
      label: "Tổng quan",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: pathname?.includes("/admin/dashboard"),
      adminOnly: false,
    },
    {
      label: "Đơn hàng",
      href: "/admin/orders",
      icon: ShoppingBag,
      active: pathname?.includes("/admin/orders"),
      adminOnly: false,
    },
    {
      label: "Xưởng may đo",
      href: "/admin/tailoring",
      icon: Scissors,
      active: pathname?.includes("/admin/tailoring"),
      adminOnly: false,
    },
    {
      label: "Sản phẩm",
      href: "/admin/products",
      icon: Shirt,
      active: pathname?.includes("/admin/products"),
      adminOnly: false,
    },
    {
      label: "Tồn kho",
      href: "/admin/inventory",
      icon: Boxes,
      active: pathname?.includes("/admin/inventory"),
      adminOnly: false,
    },
    {
      label: "Khách hàng",
      href: "/admin/customers",
      icon: Users,
      active: pathname?.includes("/admin/customers"),
      adminOnly: false,
    },
    {
      label: "Phê duyệt",
      href: "/admin/approvals",
      icon: UserCheck,
      active: pathname?.includes("/admin/approvals"),
      adminOnly: false,
    },
    ...(isSuperAdmin
      ? [
          {
            label: "Nhân sự",
            href: "/admin/staff",
            icon: Users,
            active: pathname?.includes("/admin/staff"),
            adminOnly: true,
          },
          {
            label: "Voucher",
            href: "/admin/vouchers",
            icon: Ticket,
            active: pathname?.includes("/admin/vouchers"),
            adminOnly: true,
          },
        ]
      : []),
    {
      label: "Nội dung & FAQ",
      href: "/admin/cms",
      icon: FileText,
      active: pathname?.includes("/admin/cms"),
      adminOnly: false,
    },
  ];

  return (
    <div className={`${geistSans.variable} min-h-screen bg-[#FAFAFA] flex flex-col font-geist text-[#09090B] antialiased`}>
      {/* Admin Top Header */}
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

            {/* Quick Desktop Navigation Tabs */}
            <nav className="hidden xl:flex items-center gap-1 pl-4 border-l border-zinc-200">
              {navLinks.slice(0, 7).map((item) => {
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
              <span className="hidden sm:inline">Xem cửa hàng</span>
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
            <span className="h-4 w-px bg-[#E4E4E7]" />
            <button
              onClick={async () => {
                try {
                  await adminLogoutApi();
                } catch (e) {
                  console.warn("Logout API error:", e);
                }
                document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
                document.cookie = "auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
                logout();
                router.push("/admin/login");
              }}
              className="inline-flex items-center gap-1 text-zinc-500 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Secondary Navigation Sub-bar for all screen sizes */}
        <div className="bg-zinc-50/80 border-t border-zinc-200/80 px-5 sm:px-8 lg:px-12 py-2 flex items-center gap-1 overflow-x-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  item.active
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
