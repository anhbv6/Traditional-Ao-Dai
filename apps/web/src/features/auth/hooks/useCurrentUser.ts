'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { getMeApi, type AuthUser } from '../api/auth.api';
import { clearBrowserAuthTokens } from '@/lib/api-client';

type AuthSnapshot = {
  accessToken: string | null;
  userInfo: string | null;
};

let meRequest: Promise<void> | null = null;

function emitAuthChange() {
  window.dispatchEvent(new Event('auth-storage-change'));
}

function subscribeToAuthStore(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('auth-storage-change', callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-storage-change', callback);
  };
}

function getAuthSnapshot() {
  return JSON.stringify({
    accessToken: localStorage.getItem('accessToken'),
    userInfo: localStorage.getItem('userInfo'),
  } satisfies AuthSnapshot);
}

function getServerAuthSnapshot() {
  return JSON.stringify({
    accessToken: null,
    userInfo: null,
  } satisfies AuthSnapshot);
}

function parseSnapshot(snapshot: string): AuthSnapshot {
  return JSON.parse(snapshot) as AuthSnapshot;
}

function parseUser(userInfo: string | null): AuthUser | null {
  if (!userInfo) {
    return null;
  }

  try {
    return JSON.parse(userInfo) as AuthUser;
  } catch {
    return null;
  }
}

function syncCurrentUser() {
  if (meRequest) {
    return meRequest;
  }

  meRequest = getMeApi()
    .then((res) => {
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      emitAuthChange();
    })
    .catch(() => {
      clearBrowserAuthTokens();
    })
    .finally(() => {
      meRequest = null;
    });

  return meRequest;
}

export function useCurrentUser() {
  const snapshot = useSyncExternalStore(subscribeToAuthStore, getAuthSnapshot, getServerAuthSnapshot);
  const { accessToken, userInfo } = parseSnapshot(snapshot);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    void syncCurrentUser();
  }, [accessToken]);

  return {
    isAuthenticated: Boolean(accessToken),
    user: parseUser(userInfo),
  };
}
