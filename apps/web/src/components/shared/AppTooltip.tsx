"use client";

import { type CSSProperties, type ReactElement, type ReactNode } from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";
import {
  FLOATING_ARROW_CLASS,
  FLOATING_COLLISION_PADDING,
  FLOATING_SURFACE_CLASS,
  FLOATING_TOP_BAR_CLASS,
} from "./floatingSurface";

/**
 * Tooltip dùng chung cho storefront — nhãn ngắn hiện khi rê chuột / focus bàn phím
 * (tên sản phẩm bị cắt, nút chỉ có icon, giải thích nhãn…). Không dùng cho nội dung bấm được → dùng AppPopover.
 *
 * Có sẵn: tự lật / dịch khi sát mép, render qua portal (không bị overflow cắt), mở / đóng mờ + phóng nhẹ,
 * Esc để đóng, không mở trên thiết bị cảm ứng (hành vi chuẩn của Base UI).
 *
 * Mở rộng:
 * - `variant` đổi giao diện (`inverse` | `brand` | `surface`), `size` đổi cỡ chữ / đệm, `className` ghi đè cuối.
 * - `onlyWhenTruncated`: chỉ hiện khi chữ của phần tử mở đang bị cắt (`truncate` / `line-clamp-*`).
 * - `onOpenChange(open, details)`: gọi `details.cancel()` để tự chặn mở theo điều kiện riêng.
 * - Bọc nhiều tooltip trong `AppTooltipProvider` để rê từ cái này sang cái khác hiện ngay, không chờ lại.
 *
 * @example Tên sản phẩm dài bị cắt
 * <AppTooltip content={name} onlyWhenTruncated>
 *   <Link href={href} className="block truncate">{name}</Link>
 * </AppTooltip>
 *
 * @example Nút icon
 * <AppTooltip content={t("addToWishlist")} variant="brand" side="left">
 *   <button type="button" aria-label={t("addToWishlist")}>…</button>
 * </AppTooltip>
 */

export type AppTooltipVariant = "inverse" | "brand" | "surface";
export type AppTooltipSize = "sm" | "md";

export interface AppTooltipProps {
  /** Nội dung tooltip — rỗng (`null` / `""`) thì chỉ render phần tử mở */
  content: ReactNode;
  /** Phần tử mở (1 element: button / Link / span…) — Base UI gộp props + ref vào element này */
  children: ReactElement;

  variant?: AppTooltipVariant;
  size?: AppTooltipSize;
  /** Bề rộng tối đa (px) — chữ dài tự xuống dòng */
  maxWidth?: number;
  showArrow?: boolean;

  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;

  /** Độ trễ mở / đóng (ms) */
  delay?: number;
  closeDelay?: number;
  /** Chỉ hiện khi chữ của phần tử mở đang bị cắt (tràn ngang hoặc dọc) */
  onlyWhenTruncated?: boolean;
  /** Tooltip bám theo con trỏ theo trục */
  trackCursorAxis?: "none" | "x" | "y" | "both";
  /** Cho phép rê chuột vào tooltip mà không đóng (VD để bôi đen copy chữ) — mặc định bật */
  hoverable?: boolean;
  disabled?: boolean;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, details: Tooltip.Root.ChangeEventDetails) => void;

  className?: string;
}

/** Giao diện theo variant — chỉ dùng token màu trong globals.css để dark mode tự đổi */
const VARIANT_CLASS: Record<AppTooltipVariant, string> = {
  inverse: "bg-[var(--bg-inverse)] text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.45)]",
  brand: "bg-[var(--primary-color)] text-white shadow-[0_10px_24px_-12px_rgba(128,0,32,0.55)]",
  surface: FLOATING_SURFACE_CLASS,
};

const SIZE_CLASS: Record<AppTooltipSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2 text-[13px]",
};

/** Mũi tên thoi cùng màu nền (`bg-inherit`) — đặt theo data-side do Base UI gắn */
const SOLID_ARROW_CLASS =
  "size-2 rotate-45 bg-inherit data-[side=bottom]:-top-1 data-[side=top]:-bottom-1 data-[side=left]:-right-1 data-[side=right]:-left-1";

/** Hiệu ứng mở / đóng cho variant đặc (variant `surface` đã có sẵn trong FLOATING_SURFACE_CLASS) */
const SOLID_MOTION_CLASS = cn(
  "origin-[var(--transform-origin)] transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
  "data-starting-style:scale-[0.96] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0",
);

/** Phần tử có đang bị cắt chữ không (`truncate` → tràn ngang, `line-clamp-*` → tràn dọc) */
export const isElementTruncated = (element: Element | undefined): boolean => {
  if (!(element instanceof HTMLElement)) return false;
  return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
};

export function AppTooltip({
  content,
  children,
  variant = "inverse",
  size = "sm",
  maxWidth = 280,
  showArrow = true,
  side = "top",
  align = "center",
  sideOffset = 8,
  alignOffset = 0,
  delay = 400,
  closeDelay = 0,
  onlyWhenTruncated = false,
  trackCursorAxis,
  hoverable = true,
  disabled = false,
  open,
  defaultOpen,
  onOpenChange,
  className,
}: AppTooltipProps) {
  if (content === null || content === undefined || content === "" || content === false) return children;

  const handleOpenChange = (nextOpen: boolean, details: Tooltip.Root.ChangeEventDetails) => {
    // Chữ hiển thị đủ → không cần tooltip (tránh lặp lại đúng nội dung đang thấy)
    if (nextOpen && onlyWhenTruncated && !isElementTruncated(details.trigger)) {
      details.cancel();
      return;
    }
    onOpenChange?.(nextOpen, details);
  };

  const isSurface = variant === "surface";
  const popupStyle: CSSProperties = { maxWidth };

  return (
    <Tooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      trackCursorAxis={trackCursorAxis}
      disableHoverablePopup={!hoverable}
    >
      <Tooltip.Trigger render={children} delay={delay} closeDelay={closeDelay} />
      <Tooltip.Portal>
        <Tooltip.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          collisionPadding={FLOATING_COLLISION_PADDING}
          className="z-50 outline-none"
        >
          <Tooltip.Popup
            style={popupStyle}
            className={cn(
              "relative w-max break-words font-[family-name:var(--font-lora)] leading-snug",
              VARIANT_CLASS[variant],
              SIZE_CLASS[size],
              !isSurface && SOLID_MOTION_CLASS,
              className,
            )}
          >
            {isSurface ? <span aria-hidden="true" className={FLOATING_TOP_BAR_CLASS} /> : null}
            {showArrow ? <Tooltip.Arrow className={isSurface ? FLOATING_ARROW_CLASS : SOLID_ARROW_CLASS} /> : null}
            {content}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/**
 * Bọc một nhóm tooltip (thanh icon, lưới sản phẩm…): sau khi 1 tooltip đã mở,
 * rê sang tooltip khác trong nhóm sẽ hiện ngay thay vì chờ lại `delay`.
 */
export const AppTooltipProvider = Tooltip.Provider;
