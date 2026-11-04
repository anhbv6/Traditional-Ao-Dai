"use client";

import { useCallback, useState } from "react";

export type FloatingPositionMethod = "absolute" | "fixed";

/**
 * Phần tử mở nằm trong vùng đứng yên khi cuộn (`position: fixed`, hoặc `sticky` đang dính)?
 * Sticky chưa dính thì vẫn trôi theo trang nên tính như phần tử thường.
 */
function isInPinnedArea(start: Element | null): boolean {
  for (let el = start; el && el !== document.body; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (style.position === "fixed") return true;
    if (style.position === "sticky") {
      const top = Number.parseFloat(style.top);
      if (Number.isFinite(top) && Math.abs(el.getBoundingClientRect().top - top) < 1) return true;
    }
  }
  return false;
}

/**
 * Chọn cách đặt bảng nổi (Base UI `positionMethod`) theo phần tử mở, tính lại mỗi lần mở.
 * Trình duyệt cuộn trang trên luồng riêng rồi JS mới đặt lại vị trí bảng nổi ở khung hình sau, nên:
 * - phần tử mở trôi theo trang → `absolute` (bảng trôi cùng, không giật);
 * - phần tử mở đứng yên (menu trái, cột phải, thanh dính, trong dialog) → `fixed`, nếu không bảng sẽ bị kéo
 *   theo trang một nhịp rồi nhảy về — cảm giác "giật" khi cuộn.
 *
 * @example
 * const { positionMethod, captureAnchor } = useAnchorPositionMethod();
 * <Popover.Root onOpenChange={(open, details) => open && captureAnchor(details.event)}>
 *   …<Popover.Positioner positionMethod={positionMethod}>
 */
export function useAnchorPositionMethod() {
  const [positionMethod, setPositionMethod] = useState<FloatingPositionMethod>("absolute");

  const captureAnchor = useCallback((event: Event | undefined) => {
    const target = event?.target;
    setPositionMethod(target instanceof Element && isInPinnedArea(target) ? "fixed" : "absolute");
  }, []);

  return { positionMethod, captureAnchor };
}
