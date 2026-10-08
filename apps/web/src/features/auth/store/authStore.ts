import { create } from 'zustand';
import { configureApiClient } from '@/lib/api-client';
import { type AuthUser } from '../types/auth.types';

/**
 * Trạng thái phiên đăng nhập của KHÁCH HÀNG (storefront).
 * - Access token chỉ giữ trong bộ nhớ (không localStorage, không cookie tự ghi)
 * - Refresh token nằm trong cookie httpOnly do Backend quản lý
 * - Phiên Admin/Staff KHÔNG nằm ở đây — xem `useAdminSession` (features/admin/session)
 */
interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (accessToken: string, user: AuthUser) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // true trong lúc khôi phục phiên ban đầu

  setAccessToken: (token) => set({ accessToken: token }),

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setAuthenticated: (accessToken, user) =>
    set({
      accessToken,
      user,
      isAuthenticated: true,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));

// Đăng ký trạng thái đăng nhập cho HTTP client (lib không được import ngược từ features)
configureApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onAccessTokenRefreshed: (accessToken) => useAuthStore.getState().setAccessToken(accessToken),
  onSessionExpired: () => useAuthStore.getState().logout(),
});
