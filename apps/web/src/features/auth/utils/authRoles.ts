import { useAuthStore } from '../store/authStore';

/**
 * Kiểm tra xem người dùng hiện tại có phải là Quản trị viên (Admin hoặc Staff) không.
 * Hỗ trợ kiểm tra từ Zustand store lẫn cookie (admin_token, auth_role).
 */
export function isUserAdminOrStaff(user?: { role?: string } | null): boolean {
  if (user?.role) {
    const role = user.role.toUpperCase();
    if (role === 'ADMIN' || role === 'STAFF') {
      return true;
    }
  }

  // Fallback kiểm tra từ authStore nếu không truyền user
  if (!user && typeof window !== 'undefined') {
    const storeState = useAuthStore.getState();
    if (storeState.isAdminOrStaff) {
      return true;
    }
  }

  // Fallback kiểm tra từ cookie trình duyệt
  if (typeof document !== 'undefined') {
    const cookies = document.cookie || '';
    if (
      cookies.includes('admin_token=') ||
      cookies.includes('auth_role=ADMIN') ||
      cookies.includes('auth_role=STAFF')
    ) {
      return true;
    }
  }

  return false;
}
