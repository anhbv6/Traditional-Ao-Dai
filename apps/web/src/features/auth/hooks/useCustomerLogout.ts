'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { logoutApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

/**
 * Đăng xuất khách hàng: Backend xóa phiên + cookie; client xóa trạng thái trong bộ nhớ rồi về trang đăng nhập.
 * @param beforeRedirect Việc bổ sung trước khi chuyển trang (ví dụ đăng xuất luôn phiên admin ở storefront)
 */
export function useCustomerLogout(beforeRedirect?: () => Promise<void> | void) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi();
    } catch {
      // Phiên phía server có thể đã hết — vẫn tiếp tục đăng xuất phía client
    } finally {
      useAuthStore.getState().logout();
      await beforeRedirect?.();
      router.push('/login');
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}
