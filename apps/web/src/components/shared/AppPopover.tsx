"use client";

import { type CSSProperties, type ReactElement, type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";
import {
  FLOATING_ARROW_CLASS,
  FLOATING_COLLISION_PADDING,
  FLOATING_SURFACE_CLASS,
  FLOATING_TOP_BAR_CLASS,
  isNativeButton,
  keepLinkSemantics,
} from "./floatingSurface";

/**
 * Bảng nổi nội dung tự do (xem nhanh giỏ hàng, xem nhanh yêu thích, thẻ thông tin, bộ lọc nhỏ…).
 * Cùng khung với AppMenu (floatingSurface) nhưng dùng Base UI Popover → đúng ngữ nghĩa cho nội dung phức tạp
 * (danh sách, nút, form) thay vì role="menu".
 *
 * Có sẵn: Esc để đóng, bấm ra ngoài để đóng, trả focus, tự lật khi sát mép, render qua portal (không bị cắt),
 * `openOnHover` với độ trễ mở / đóng để rê chuột qua khe hở không bị tắt.
 *
 * @example Xem nhanh khi rê chuột
 * <AppPopover trigger={<Link href="/cart">…</Link>} openOnHover width={340} title={t("mini.title")}>
 *   …nội dung…
 * </AppPopover>
 */
export interface AppPopoverProps {
  /** Phần tử mở bảng (1 element: button / Link) */
  trigger: ReactElement;
  /** Phần tử mở có phải <button> gốc không — mặc định tự đoán theo thẻ (Link / <a> → false) */
  nativeButton?: boolean;
  children: ReactNode;
  /** Tiêu đề cho trình đọc màn hình (Popover.Title) — hiện trực quan ở đầu bảng khi truyền `header` = undefined */
  title?: ReactNode;
  /** Phần đầu tự dựng (thay tiêu đề mặc định), VD tiêu đề + số lượng */
  header?: ReactNode;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Mở khi rê chuột (desktop) */
  openOnHover?: boolean;
  /** Độ trễ mở / đóng khi rê chuột (ms) */
  delay?: number;
  closeDelay?: number;
  /** Tắt hẳn bảng (VD đang ở trang giỏ hàng) — chỉ còn phần tử mở */
  disabled?: boolean;

  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Bề rộng px hoặc `trigger` (bằng phần tử mở) */
  width?: number | "trigger";
  showArrow?: boolean;
  className?: string;
}

export function AppPopover({
  trigger,
  nativeButton,
  children,
  title,
  header,
  open,
  onOpenChange,
  openOnHover = false,
  delay = 80,
  closeDelay = 180,
  disabled = false,
  side = "bottom",
  align = "end",
  sideOffset = 10,
  width = 320,
  showArrow = true,
  className,
}: AppPopoverProps) {
  if (disabled) return trigger;

  const widthStyle: CSSProperties | undefined = typeof width === "number" ? { width } : undefined;

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger
        render={keepLinkSemantics(trigger)}
        nativeButton={nativeButton ?? isNativeButton(trigger)}
        openOnHover={openOnHover}
        delay={delay}
        closeDelay={closeDelay}
      />
      <Popover.Portal>
        <Popover.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={FLOATING_COLLISION_PADDING}
          className="z-50 outline-none"
        >
          <Popover.Popup
            style={widthStyle}
            className={cn(FLOATING_SURFACE_CLASS, width === "trigger" && "min-w-[var(--anchor-width)]", className)}
          >
            <span aria-hidden="true" className={FLOATING_TOP_BAR_CLASS} />
            {showArrow ? <Popover.Arrow className={FLOATING_ARROW_CLASS} /> : null}

            {header ?? (title ? (
              <div className="border-b border-[var(--border)] px-4 py-3">
                <Popover.Title className="font-[family-name:var(--font-playfair)] text-[15px] font-semibold">{title}</Popover.Title>
              </div>
            ) : null)}

            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Tiêu đề ngữ nghĩa dùng trong `header` tự dựng (để trình đọc màn hình đọc tên bảng) */
export const AppPopoverTitle = Popover.Title;
/** Bọc phần tử để bấm vào thì đóng bảng (VD link "Xem giỏ hàng") */
export const AppPopoverClose = Popover.Close;
