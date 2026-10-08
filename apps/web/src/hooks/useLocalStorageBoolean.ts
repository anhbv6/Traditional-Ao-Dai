"use client";

import { useCallback, useSyncExternalStore } from "react";

const LOCAL_STORAGE_EVENT = "local-storage-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_STORAGE_EVENT, onChange);
  };
}

function readBoolean(key: string, defaultValue: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? defaultValue : raw === "true";
  } catch {
    return defaultValue;
  }
}

/**
 * Tùy chọn bật/tắt lưu ở localStorage (chỉ cho tiện ích phía trình duyệt, không phải dữ liệu nghiệp vụ).
 * Dùng useSyncExternalStore: server render giá trị mặc định, client đọc localStorage mà không cần setState trong effect.
 */
export function useLocalStorageBoolean(key: string, defaultValue: boolean) {
  const value = useSyncExternalStore(
    subscribe,
    () => readBoolean(key, defaultValue),
    () => defaultValue
  );

  const setValue = useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // Trình duyệt chặn storage -> bỏ qua
      }
      window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT));
    },
    [key]
  );

  return [value, setValue] as const;
}
