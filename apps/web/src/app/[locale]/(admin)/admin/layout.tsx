"use client";

import React, { ReactNode, useState } from "react";
import { Geist } from "next/font/google";
import { useLocale } from "next-intl";
import {
  Shield,
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
  Store,
  ChevronDown,
  UserCog,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { adminLogoutApi } from "@/features/admin/login";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AdminProfileDialog } from "@/features/admin/components/AdminProfileDialog";

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isLoginPage = pathname?.includes("/admin/login");

  const handleLogout = async () => {
    try {
      await adminLogoutApi();
    } catch (e) {
      console.warn("Logout API error:", e);
    }
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    const cookies = typeof document !== "undefined" ? document.cookie : "";
    const hasCustomerSession = cookies.includes("user_logged_in=true") || cookies.includes("refreshToken=");
    if (hasCustomerSession) {
      document.cookie = "auth_role=CUSTOMER; path=/; SameSite=Lax";
    } else {
      document.cookie = "auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
    logout();
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return (
      <div className={`${geistSans.variable} min-h-screen flex flex-col font-geist text-[#09090B] antialiased`}>
        {children}
      </div>
    );
  }

  const roleFromCookie = typeof document !== "undefined"
    ? document.cookie.match(/auth_role=([^;]+)/)?.[1]
    : null;
  const currentRole = user?.role || (roleFromCookie ? decodeURIComponent(roleFromCookie) : undefined);
  const isSuperAdmin = currentRole === "ADMIN";

  const isSuperAdminOnlyRoute =
    pathname?.includes("/admin/staff") || pathname?.includes("/admin/vouchers");

  if (isSuperAdminOnlyRoute && !isSuperAdmin && currentRole === "STAFF") {
    return (
      <div className={`${geistSans.variable} min-h-screen bg-[#FAFAFA] flex flex-col font-geist text-[#09090B] antialiased`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <div className="size-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Shield size={24} />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Truy Cập Bị Giới Hạn</h2>
            <p className="text-xs text-zinc-500">
              Trang này yêu cầu quyền Quản trị viên tối cao (Super Admin). Tài khoản của bạn hiện có vai trò Nhân viên (Staff).
            </p>
            <Link
              href="/admin/dashboard"
              className="inline-flex h-9 items-center justify-center px-4 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              Về Bảng Điều Khiển
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="flex items-center gap-3 text-xs font-medium">
            {/* Nút về trang khách hàng (Client store) */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-all border border-zinc-200/80 bg-white shadow-2xs"
              title="Xem trang cửa hàng khách hàng"
            >
              <Store size={14} className="text-zinc-600" />
              <span className="hidden sm:inline">Xem cửa hàng</span>
            </Link>

            <span className="h-4 w-px bg-zinc-200" />

            {/* Menu tài khoản làm gọn gàng (User Dropdown) */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-zinc-100 transition-all border border-zinc-200/90 bg-white cursor-pointer select-none outline-none shadow-2xs">
                <div className="size-7 rounded-full overflow-hidden border border-zinc-200 bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "Admin"}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span>{(user?.name || user?.email || "A")[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-semibold text-xs leading-tight text-zinc-900 max-w-[120px] truncate">
                    {user?.name || user?.email || "Quản trị viên"}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {isSuperAdmin ? "Super Admin" : "Nhân viên (Staff)"}
                  </span>
                </div>
                <ChevronDown size={13} className="text-zinc-400" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg rounded-xl border border-zinc-200 bg-white">
                <div className="px-3 py-2 border-b border-zinc-100">
                  <p className="font-semibold text-xs text-zinc-900 truncate">
                    {user?.name || "Quản trị viên"}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
                  <span className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] font-semibold text-zinc-700">
                    {isSuperAdmin ? "Super Admin" : "Nhân viên (Staff)"}
                  </span>
                </div>

                <DropdownMenuItem
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors mt-1"
                >
                  <UserCog size={14} className="text-zinc-500" />
                  <span>Sửa hồ sơ tài khoản</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/")}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
                >
                  <Store size={14} className="text-zinc-500" />
                  <span>Về trang cửa hàng</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-zinc-100" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                >
                  <LogOut size={14} className="text-rose-500" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {/* Admin Profile & Password Modal */}
      <AdminProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </div>
  );
}
