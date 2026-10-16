import { cloneElement, type ReactElement } from "react";
import { cn } from "@/lib/utils";

/**
 * Khung "nổi" dùng chung cho AppMenu (menu thả xuống) và AppPopover (bảng nổi nội dung tự do)
 * → cùng một ngôn ngữ: góc vuông, nền kem, viền mảnh, bóng ấm, vạch đỏ đô ở đỉnh, mũi tên thoi đỏ đô,
 * mở / đóng mờ + phóng nhẹ từ phía phần tử mở (--transform-origin do Base UI tính).
 */

/** Class cho Popup (Menu.Popup / Popover.Popup) — dùng cùng thuộc tính data-starting-style / data-ending-style của Base UI */
export const FLOATING_SURFACE_CLASS = cn(
  "relative origin-[var(--transform-origin)] border border-[var(--border)] bg-[var(--bg-card)] font-[family-name:var(--font-lora)] text-[var(--text-main)] outline-none",
  "shadow-[0_24px_50px_-20px_rgba(60,0,15,0.35)]",
  "transition-[opacity,scale,translate] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
  "data-starting-style:scale-[0.97] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0",
);

/** Vạch đỏ đô ở đỉnh — render như 1 <span aria-hidden> đầu tiên trong Popup */
export const FLOATING_TOP_BAR_CLASS = "pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] bg-[var(--primary-color)]";

/** Mũi tên thoi đỏ đô (Menu.Arrow / Popover.Arrow) — tự đặt theo data-side */
export const FLOATING_ARROW_CLASS =
  "size-2.5 rotate-45 bg-[var(--primary-color)] data-[side=bottom]:-top-[5px] data-[side=top]:-bottom-[5px] data-[side=left]:-right-[5px] data-[side=right]:-left-[5px]";

/** Khoảng cách tới mép màn hình khi tự lật / dịch để không tràn */
export const FLOATING_COLLISION_PADDING = 12;

/**
 * Phần tử mở có phải <button> gốc không — Base UI cần biết để gắn đúng ngữ nghĩa
 * (Link / <a> → `nativeButton={false}`, Base UI tự thêm role="button" + xử lý phím).
 * Component tự dựng (VD ActionButton) không đoán được → truyền `nativeButton` thủ công khi cần.
 */
export const isNativeButton = (element: ReactElement) => element.type === "button";

/**
 * Link làm phần tử mở (VD icon giỏ hàng → /cart): Base UI coi trigger là nút và gắn role="button".
 * Props của element được ưu tiên khi Base UI gộp props → gắn lại role="link" để trình đọc màn hình đọc đúng
 * "link, có bảng bật lên" (bấm vẫn điều hướng, rê chuột / focus vẫn mở bảng).
 */
export const keepLinkSemantics = (element: ReactElement): ReactElement => {
  const props = element.props as { href?: unknown; role?: string };
  return props.href !== undefined && props.role === undefined
    ? cloneElement(element as ReactElement<{ role?: string }>, { role: "link" })
    : element;
};
