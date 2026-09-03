"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getAdminNavLinks } from "../queries/header.queries";
import { executeAdminLogout } from "../actions/header.actions";
import { type AdminLayoutState } from "../types/header.types";

export function useAdminLayout(): AdminLayoutState {
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations("AdminPage.nav");
  const { user, isAdmin, isStaff, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Tự động khôi phục dữ liệu adminUser từ localStorage khi F5/reload trang (do admin không dùng api /me)
  useEffect(() => {
    setIsHydrated(true);
    if (!user && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("admin_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          useAuthStore.getState().setUser(parsed);
        }
      } catch (err) {
        console.warn("Lỗi khôi phục admin_user từ localStorage:", err);
      }
    }
  }, [user]);

  // 1. Kiểm tra trang đăng nhập
  const isLoginPage = Boolean(pathname?.includes("/admin/login"));

  // 2. Xác định vai trò quản trị (ưu tiên từ state store, fallback cookie)
  const roleFromCookie = typeof document !== "undefined"
    ? document.cookie.match(/auth_role=([^;]+)/)?.[1]
    : null;
  const isSuperAdmin = isAdmin || roleFromCookie === "ADMIN";
  const isStaffRole = isStaff || roleFromCookie === "STAFF";
  const currentRole = isSuperAdmin ? "ADMIN" : isStaffRole ? "STAFF" : user?.role;

  // 3. Kiểm tra phân quyền truy cập trang Super Admin (Staff không có quyền vào /staff, /vouchers)
  const isSuperAdminOnlyRoute = Boolean(
    pathname?.includes("/admin/staff") || pathname?.includes("/admin/vouchers")
  );
  const isAccessDenied = Boolean(isSuperAdminOnlyRoute && !isSuperAdmin && isStaffRole);

  // 4. Danh sách menu đã được lọc quyền, gán active và tích hợp dịch i18n
  const navLinks = getAdminNavLinks(pathname, isSuperAdmin, (key) => tNav(key));

  // 5. Xử lý đăng xuất quản trị viên kèm loading state
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await executeAdminLogout();
      logout();
      router.push("/admin/login");
    } catch (err) {
      console.error("Lỗi đăng xuất quản trị viên:", err);
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
    isHydrated,
    isLoggingOut,
    navLinks,
    isProfileOpen,
    setIsProfileOpen,
    handleLogout,
  };
}
