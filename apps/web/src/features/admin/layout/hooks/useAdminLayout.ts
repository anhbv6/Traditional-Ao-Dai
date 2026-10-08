"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAdminSession, useAdminSessionCache } from "../../session";
import { getAdminNavLinks } from "../queries/header.queries";
import { executeAdminLogout } from "../actions/header.actions";
import { type AdminLayoutState } from "../types/header.types";

export function useAdminLayout(): AdminLayoutState {
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations("AdminPage.nav");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 1. Kiểm tra trang đăng nhập
  const isLoginPage = Boolean(pathname?.includes("/admin/login"));

  // 2. Phiên quản trị lấy từ server (xác minh token + phiên + DB), không dùng localStorage hay cookie đọc bằng JS
  const { user, isLoading, isAdmin: isSuperAdmin, isStaff } = useAdminSession({ force: !isLoginPage });
  const sessionCache = useAdminSessionCache();
  const currentRole = user?.role;

  // 3. Staff không có quyền vào /staff, /vouchers (proxy và page cũng chặn ở server)
  const isSuperAdminOnlyRoute = Boolean(
    pathname?.includes("/admin/staff") || pathname?.includes("/admin/vouchers")
  );
  const isAccessDenied = Boolean(isSuperAdminOnlyRoute && isStaff);

  // 4. Danh sách menu đã được lọc quyền, gán active và tích hợp dịch i18n
  const navLinks = getAdminNavLinks(pathname, isSuperAdmin, (key) => tNav(key));

  // 5. Đăng xuất
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await executeAdminLogout();
      sessionCache.clear();
      router.push("/admin/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    user,
    currentRole,
    isSuperAdmin,
    isLoginPage,
    isAccessDenied,
    isHydrated: !isLoading,
    isLoggingOut,
    navLinks,
    isProfileOpen,
    setIsProfileOpen,
    handleLogout,
  };
}
