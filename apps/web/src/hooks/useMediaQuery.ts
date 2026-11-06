"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Theo dõi một media query (vd `(min-width: 768px)`) — dùng khi phải đổi cả cây render / dữ liệu theo cỡ màn
 * (không ẩn được bằng CSS). `serverValue` là giá trị khi render phía server và lần hydrate đầu.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}
