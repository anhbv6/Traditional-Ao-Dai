"use client";

import React, { ReactNode } from "react";
import { Geist } from "next/font/google";
import {
  AdminHeader,
  AdminAccessDenied,
  useAdminLayout,
} from "@/features/admin/components/header";
import { AdminProfileDialog } from "@/features/admin/components/AdminProfileDialog";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";

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
  const {
    user,
    isSuperAdmin,
    isLoginPage,
    isAccessDenied,
    isHydrated,
    isLoggingOut,
    navLinks,
    isProfileOpen,
    setIsProfileOpen,
    handleLogout,
  } = useAdminLayout();

  // 1. Trang đăng nhập không hiển thị header và sub-navigation
  if (isLoginPage) {
    return (
      <div className={`${geistSans.variable} min-h-screen flex flex-col font-geist text-[#09090B] antialiased`}>
        {children}
      </div>
    );
  }

  // 2. Trạng thái Loading / Khởi tạo hydration ban đầu (sử dụng chung LoadingOverlay với client)
  if (!isHydrated) {
    return (
      <div className={`${geistSans.variable} min-h-screen bg-[#FAFAFA] flex flex-col font-geist text-[#09090B] antialiased`}>
        <LoadingOverlay visible={true} />
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  // 3. Trang giới hạn quyền Super Admin khi nhân viên (Staff) cố truy cập
  if (isAccessDenied) {
    return (
      <div className={`${geistSans.variable} min-h-screen bg-[#FAFAFA] flex flex-col font-geist text-[#09090B] antialiased`}>
        <AdminAccessDenied />
      </div>
    );
  }

  // 4. Khung sườn layout quản trị chuẩn
  return (
    <div className={`${geistSans.variable} min-h-screen bg-[#FAFAFA] flex flex-col font-geist text-[#09090B] antialiased`}>
      <AdminHeader
        user={user}
        isSuperAdmin={isSuperAdmin}
        navLinks={navLinks}
        isLoggingOut={isLoggingOut}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      {/* Vùng nội dung chính */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Modal sửa hồ sơ tài khoản quản trị viên */}
      <AdminProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />

      {/* Loading overlay chung khi đang thực hiện thao tác logout */}
      <LoadingOverlay visible={isLoggingOut} />
    </div>
  );
}
