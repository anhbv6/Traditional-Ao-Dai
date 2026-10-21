import { adminLogoutApi } from "./adminLogin.api";

/**
 * Đăng xuất quản trị viên: Backend thu hồi phiên và xóa cookie (admin_token, admin_session).
 * Client không tự xóa cookie. Lỗi mạng / phiên đã hết vẫn coi như đăng xuất xong phía client.
 * @returns true khi Backend xác nhận đăng xuất
 */
export async function executeAdminLogout(): Promise<boolean> {
  try {
    await adminLogoutApi();
    return true;
  } catch (error) {
    console.warn("Lỗi API đăng xuất quản trị viên:", error);
    return false;
  }
}
