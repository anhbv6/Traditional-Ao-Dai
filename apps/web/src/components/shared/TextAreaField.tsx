"use client";

import {
  useId,
  useRef,
  useState,
  useLayoutEffect,
  type ChangeEvent,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { textFieldToneVars, type TextFieldAppearance, type TextFieldTone } from "./textFieldTone";

function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
  if (typeof window === "undefined" || !node) {
    return typeof window !== "undefined" ? window : (null as unknown as Window);
  }
  let parent = node.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(parent);
    if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

export interface TextAreaFieldProps extends Omit<ComponentProps<"textarea">, "value" | "defaultValue"> {
  ref?: Ref<HTMLTextAreaElement>;
  /** Nhãn — không truyền thì nên truyền `aria-label` */
  label?: ReactNode;
  /** `underline` (mặc định, giống TextField / màn Liên hệ): chỉ gạch chân. `outline`: viền hộp */
  appearance?: TextFieldAppearance;
  /** Tông màu theo nền đặt ô — cùng bảng màu với TextField (`default` | `onPrimary` | `admin`) */
  tone?: TextFieldTone;
  /** Chữ gợi ý dưới ô */
  helperText?: ReactNode;
  /** Lỗi xác thực: chuỗi/node = hiện thông báo; `true` = chỉ tô viền lỗi */
  error?: ReactNode | boolean;
  /** Hiện bộ đếm ký tự (kết hợp `maxLength` sẽ hiện dạng 12/500) */
  showCount?: boolean;
  /** Cao theo nội dung (bắt đầu từ `rows`, tối đa ~10 dòng rồi cuộn) — gạch chân luôn sát chữ */
  autoResize?: boolean;
  /** Controlled: giá trị hiện tại */
  value?: string;
  /** Uncontrolled: giá trị ban đầu */
  defaultValue?: string;
  /** Gọi mỗi lần đổi nội dung */
  onValueChange?: (value: string) => void;
  /** Class cho khung ngoài cùng */
  className?: string;
  /** Class cho thẻ <textarea> */
  textareaClassName?: string;
  /** Class cho nhãn */
  labelClassName?: string;
}

/* Cùng ngôn ngữ thiết kế với TextField: nhãn in hoa nhỏ giãn chữ, đổi màu khi focus. Màu chỉ đọc biến --tf-* theo tone */
const LABEL_CLASS =
  "block text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--tf-label)] transition-colors duration-300 group-focus-within/field:text-[var(--tf-label-focus)]";

const APPEARANCE_CLASS: Record<TextFieldAppearance, string> = {
  underline: "border-0 border-b bg-transparent px-0",
  outline: "border bg-[var(--tf-field-bg)] px-3 focus:ring-2 focus:ring-[var(--tf-ring)]",
};

/**
 * Ô nhập nhiều dòng dùng chung — cặp đôi với TextField (cùng nhãn, viền, thông báo lỗi, bộ đếm).
 *
 * @example
 * <TextAreaField label={t("message")} rows={4} maxLength={500} showCount value={message} onValueChange={setMessage} />
 */
export function TextAreaField({
  ref,
  label,
  appearance = "underline",
  tone = "default",
  helperText,
  error,
  showCount = false,
  rows = 3,
  autoResize = false,
  value,
  defaultValue,
  onValueChange,
  onChange,
  onWheel,
  maxLength,
  id: idProp,
  className,
  textareaClassName,
  labelClassName,
  disabled,
  style,
  "aria-describedby": ariaDescribedByProp,
  ...props
}: TextAreaFieldProps) {
  const t = useTranslations("Common.textField");
  const autoId = useId();
  const textareaId = idProp ?? `textarea-${autoId}`;
  const messageId = `${textareaId}-message`;
  const helperId = `${textareaId}-helper`;
  const counterId = `${textareaId}-counter`;
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  // Tự giữ giá trị khi uncontrolled để bộ đếm vẫn chạy
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");
  const currentValue = value ?? innerValue;

  const hasError = Boolean(error);
  const errorMessage = typeof error === "boolean" ? null : error;
  const hasBottom = Boolean(helperText || errorMessage || showCount);
  const describedBy =
    [ariaDescribedByProp, errorMessage && messageId, helperText && helperId, showCount && counterId].filter(Boolean).join(" ") || undefined;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined) setInnerValue(event.target.value);
    onValueChange?.(event.target.value);
    onChange?.(event);
  };

  const setMergedRefs = (node: HTMLTextAreaElement | null) => {
    localRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref && typeof ref === "object") {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    }
  };

  // Tự động giãn chiều cao theo nội dung khi autoResize bật (tránh sinh thanh cuộn giam giữ con lăn chuột)
  useLayoutEffect(() => {
    if (!autoResize) return;
    const el = localRef.current;
    if (!el) return;
    el.style.height = "auto";
    const minHeight = (typeof rows === "number" ? rows : Number(rows) || 3) * 24 + 16;
    const newHeight = Math.max(el.scrollHeight, minHeight);
    el.style.height = `${newHeight}px`;
  }, [currentValue, autoResize, rows]);

  // Xử lý wheel: Khi di chuột qua ô textarea không bị "bắt giữ" thanh cuộn trang
  const handleWheel = (event: React.WheelEvent<HTMLTextAreaElement>) => {
    onWheel?.(event);
    if (event.defaultPrevented) return;

    const el = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const canScroll = scrollHeight > clientHeight + 1;

    // 1. Nếu textarea không bị tràn (nội dung ngắn): để sự kiện lăn cuộn tự nhiên ra ngoài
    if (!canScroll) return;

    // 2. Nếu đã cuộn chạm mép theo hướng lăn (đáy hoặc đỉnh): chuyển tiếp cuộn cho container cha / window
    const deltaY = event.deltaY;
    const isAtTop = scrollTop <= 0 && deltaY < 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && deltaY > 0;

    if (isAtTop || isAtBottom) {
      const scrollParent = getScrollParent(el);
      scrollParent.scrollBy({ top: deltaY, behavior: "auto" });
    }
  };

  return (
    <div
      className={cn("group/field w-full", disabled && "cursor-not-allowed opacity-55", className)}
      style={{ ...textFieldToneVars(tone, appearance), ...style } as CSSProperties}
    >
      {label ? (
        <label htmlFor={textareaId} className={cn(LABEL_CLASS, "mb-2", hasError && "text-[var(--tf-invalid)] group-focus-within/field:text-[var(--tf-invalid)]", labelClassName)}>
          {label}
        </label>
      ) : null}

      <textarea
        ref={setMergedRefs}
        id={textareaId}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={handleChange}
        onWheel={handleWheel}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        /* Chỉ gắn data-lenis-prevent ở storefront (nơi có Lenis), khu vực admin không dùng Lenis */
        {...(tone !== "admin" ? { "data-lenis-prevent": true } : {})}
        className={cn(
          "scrollbar-brand block w-full py-2.5 text-[15px] leading-7 text-[var(--tf-text)] outline-none transition-[border-color,box-shadow] duration-300",
          autoResize ? "field-sizing-content max-h-[28rem] resize-none" : "resize-y overscroll-y-auto",
          "border-[var(--tf-border)] placeholder:text-[var(--tf-placeholder)]",
          "hover:not-focus:border-[var(--tf-border-hover)] focus:border-[var(--tf-border-focus)] disabled:cursor-not-allowed",
          APPEARANCE_CLASS[appearance],
          hasError && "border-[var(--tf-invalid)] hover:not-focus:border-[var(--tf-invalid)] focus:border-[var(--tf-invalid)]",
          textareaClassName,
        )}
        {...props}
      />

      {hasBottom ? (
        <div className="mt-1.5 flex items-start justify-between gap-4 text-xs leading-5">
          <div className="min-w-0 space-y-0.5">
            {errorMessage ? (
              <p id={messageId} role="alert" className="flex items-start gap-1.5 text-[var(--tf-invalid)] motion-safe:animate-shake">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            ) : null}
            {helperText ? (
              <p id={helperId} className="text-[var(--tf-muted)]">
                {helperText}
              </p>
            ) : null}
          </div>
          {showCount ? (
            <span
              id={counterId}
              aria-label={
                maxLength
                  ? t("counter", { count: currentValue.length, max: maxLength })
                  : t("counterNoMax", { count: currentValue.length })
              }
              className={cn(
                "shrink-0 tabular-nums text-[var(--tf-muted)]",
                maxLength !== undefined && currentValue.length >= maxLength && "text-[var(--tf-invalid)]",
              )}
            >
              {maxLength ? `${currentValue.length}/${maxLength}` : currentValue.length}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
