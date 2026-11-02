"use client";

import React, { type ReactNode } from "react";
import {
  AdminHeader,
  AdminSidebar,
  AdminAccessDenied,
  useAdminLayout,
} from "@/features/admin/core/layout";
import { AdminProfileDialog } from "@/features/admin/core/session";
import { AppLoading } from "@/components/shared/AppLoading";


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

  // 2. Trạng thái Loading / Khởi tạo hydration ban đầu (sử dụng chung AppLoading với client)
  if (!isHydrated) {
    return (
      <div className={`${SHELL_CLASS} bg-[#FAFAFA]`}>
        <AppLoading visible={true} />
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

  const navProps = {
    user,
    isSuperAdmin,
    navLinks,
    isLoggingOut,
    onOpenProfile: () => setIsProfileOpen(true),
    onLogout: handleLogout,
  };

  // 4. Khung sườn layout quản trị chuẩn: menu trái ở desktop, thanh trên + ngăn kéo ở màn nhỏ
  return (
    <div className={`${SHELL_CLASS} bg-[#FAFAFA] lg:flex-row`}>
      <AdminSidebar {...navProps} />

      {/* min-w-0: để bảng / bảng kanban tự cuộn ngang thay vì đẩy tràn khung trang */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader {...navProps} />

        {/* Vùng nội dung chính */}
        <main className="flex-1 flex flex-col">{children}</main>
      </div>

      {/* Modal sửa hồ sơ tài khoản quản trị viên */}
      <AdminProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />

      {/* Loading overlay chung khi đang thực hiện thao tác logout */}
      <AppLoading visible={isLoggingOut} />
    </div>
  );
}
