import { create } from 'zustand';
import { type AuthUser } from '../types/auth.types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Các cờ phân quyền tiện ích
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  isAdminOrStaff: boolean;

  // Actions
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (accessToken: string, user: AuthUser) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const computeRoleFlags = (user: AuthUser | null) => {
  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF';
  const isCustomer = role === 'CUSTOMER';
  const isAdminOrStaff = isAdmin || isStaff;

  return {
    isAdmin,
    isStaff,
    isCustomer,
    isAdminOrStaff,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Khởi tạo true trong lúc kiểm tra phiên làm việc ban đầu

  // Khởi tạo mặc định các cờ vai trò
  isAdmin: false,
  isStaff: false,
  isCustomer: false,
  isAdminOrStaff: false,

  setAccessToken: (token) => set({ accessToken: token }),

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      ...computeRoleFlags(user),
    }),

  setAuthenticated: (accessToken, user) =>
    set({
      accessToken,
      user,
      isAuthenticated: true,
      isLoading: false,
      ...computeRoleFlags(user),
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
      isStaff: false,
      isCustomer: false,
      isAdminOrStaff: false,
    });
  },
}));
