"use client";

import React, { ReactNode } from "react";
import {
  AdminHeader,
  AdminAccessDenied,
  useAdminLayout,
} from "@/features/admin/layout";
import { AdminProfileDialog } from "@/features/admin/session";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";


// Khung chung của khu vực admin: font Inter (--font-admin) + reset kiểu chữ storefront (xem .admin-shell trong globals.css)
const SHELL_CLASS = "admin-shell flex min-h-screen flex-col antialiased";

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
      <div className={SHELL_CLASS}>
        {children}
      </div>
    );
  }

  // 2. Trạng thái Loading / Khởi tạo hydration ban đầu (sử dụng chung LoadingOverlay với client)
  if (!isHydrated) {
    return (
      <div className={`${SHELL_CLASS} bg-[#FAFAFA]`}>
        <LoadingOverlay visible={true} />
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  // 3. Trang giới hạn quyền Super Admin khi nhân viên (Staff) cố truy cập
  if (isAccessDenied) {
    return (
      <div className={`${SHELL_CLASS} bg-[#FAFAFA]`}>
        <AdminAccessDenied />
      </div>
    );
  }

  // 4. Khung sườn layout quản trị chuẩn
  return (
    <div className={`${SHELL_CLASS} bg-[#FAFAFA]`}>
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
