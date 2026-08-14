'use client';

import { useAuthStore } from '../store/authStore';

export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  return {
    accessToken,
    isAuthenticated,
    isLoading,
    user,
  };
}
