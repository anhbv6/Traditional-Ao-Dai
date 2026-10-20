"use client";

import { useEffect, useRef } from "react";

/**
 * Ghi chiều cao THẬT của khối header (gồm cả AdminQuickBar nếu có) vào biến CSS `--site-header-h` trên <html>.
 * Dùng cho phần tử ghim dưới header (`sticky top-[calc(var(--site-header-h)+1rem)]`) hoặc cao vừa màn hình
 * (`h-[calc(100svh-var(--site-header-h)-2rem)]`) — không bị header che dù header đổi cao theo breakpoint.
 * Giá trị mặc định (trước khi đo) khai báo ở globals.css mục 1b.
 * Đồng thời gắn cờ `data-site-header` lên <html> khi trang có header dính (gỡ khi rời trang) —
 * vùng thông báo (components/ui/toast) dựa vào cờ này để hiện ngay dưới header thay vì sát góc trên.
 */
export function HeaderHeightSync() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrapper = markerRef.current?.parentElement;
    if (!wrapper) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--site-header-h", `${wrapper.offsetHeight}px`);
    update();
    root.setAttribute("data-site-header", "");
    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    return () => {
      observer.disconnect();
      root.removeAttribute("data-site-header");
      root.style.removeProperty("--site-header-h");
    };
  }, []);

  return <span ref={markerRef} hidden />;
}
