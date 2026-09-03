import { adminLogoutApi } from "@/features/admin/login";

/**
 * Xử lý nghiệp vụ đăng xuất quản trị viên: gọi API và dọn dẹp cookie
 */
export async function executeAdminLogout(): Promise<{ success: boolean; error?: string }> {
  try {
    await adminLogoutApi();
  } catch (e: any) {
    console.warn("Lỗi API đăng xuất quản trị viên:", e);
  }

  try {
    if (typeof document !== "undefined") {
      document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      const cookies = document.cookie;
      const hasCustomerSession =
        cookies.includes("user_logged_in=true") || cookies.includes("refreshToken=");
      if (hasCustomerSession) {
        document.cookie = "auth_role=CUSTOMER; path=/; SameSite=Lax";
      } else {
        document.cookie = "auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("admin_user");
        } catch {}
      }
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
