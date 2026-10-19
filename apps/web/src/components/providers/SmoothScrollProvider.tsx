"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import ClickSpark from "@/components/effects/ClickSpark";

/**
 * Đổi trang (pathname khác) → về đầu trang ngay lập tức.
 * Lenis giữ vị trí cuộn riêng nên lệnh cuộn lên đầu mặc định của Next bị Lenis kéo ngược lại → phải gọi qua Lenis.
 * - Bỏ qua lần dựng đầu (tải trang / F5 giữ hành vi của trình duyệt).
 * - URL có hash (vd. `#product-list`) thì để trang đích tự cuộn tới đúng vị trí.
 * - Chỉ đổi query (`?category=`) trên cùng trang thì không nhảy lên đầu.
 */
function ScrollToTopOnRouteChange() {
  const pathname = usePathname();
  const lenis = useLenis();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (window.location.hash) return;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname, lenis]);

  return null;
}

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.includes("/admin");

  if (isAdmin) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <ScrollToTopOnRouteChange />
      <ClickSpark sparkColor="#E2A79E" sparkSize={9} sparkRadius={22} sparkCount={10}>
        {children}
      </ClickSpark>
    </ReactLenis>
  );
}
