import { adminLogoutApi } from "@/features/admin/login";

/**
 * Đăng xuất quản trị viên: Backend thu hồi phiên và xóa cookie (admin_token, admin_session).
 * Client không tự xóa cookie.
 */
export async function executeAdminLogout(): Promise<{ success: boolean; error?: string }> {
  try {
    await adminLogoutApi();
    return { success: true };
  } catch (error) {
    console.warn("Lỗi API đăng xuất quản trị viên:", error);
    return { success: false, error: error instanceof Error ? error.message : undefined };
  }
}
