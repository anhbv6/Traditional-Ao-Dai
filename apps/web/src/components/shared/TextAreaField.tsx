"use client";

import { useId, useState, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface TextAreaFieldProps extends Omit<ComponentProps<"textarea">, "value" | "defaultValue"> {
  /** Nhãn — không truyền thì nên truyền `aria-label` */
  label?: ReactNode;
  /** `underline` (mặc định, giống TextField / màn Liên hệ): chỉ gạch chân. `outline`: viền hộp */
  appearance?: "underline" | "outline";
  /** Chữ gợi ý dưới ô */
  helperText?: ReactNode;
  /** Lỗi xác thực: chuỗi/node = hiện thông báo; `true` = chỉ tô viền lỗi */
  error?: ReactNode | boolean;
  /** Hiện bộ đếm ký tự (kết hợp `maxLength` sẽ hiện dạng 12/500) */
  showCount?: boolean;
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
}

/* Cùng ngôn ngữ thiết kế với TextField: nhãn in hoa nhỏ giãn chữ, đổi màu khi focus; gạch chân / viền đỏ đô khi focus */
const LABEL_CLASS =
  "block text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)] transition-colors duration-300 group-focus-within/field:text-[var(--primary-ink)]";

const APPEARANCE_CLASS: Record<NonNullable<TextAreaFieldProps["appearance"]>, string> = {
  underline: "border-0 border-b bg-transparent px-0",
  outline: "border bg-[var(--bg-card)] px-3 focus:ring-2 focus:ring-[color-mix(in_oklab,var(--ring)_25%,transparent)]",
};

/**
 * Ô nhập nhiều dòng dùng chung — cặp đôi với TextField (cùng nhãn, viền, thông báo lỗi, bộ đếm).
 *
 * @example
 * <TextAreaField label={t("message")} rows={4} maxLength={500} showCount value={message} onValueChange={setMessage} />
 */
export function TextAreaField({
  label,
  appearance = "underline",
  helperText,
  error,
  showCount = false,
  value,
  defaultValue,
  onValueChange,
  onChange,
  maxLength,
  id: idProp,
  className,
  textareaClassName,
  disabled,
  "aria-describedby": ariaDescribedByProp,
  ...props
}: TextAreaFieldProps) {
  const t = useTranslations("Common.textField");
  const autoId = useId();
  const textareaId = idProp ?? `textarea-${autoId}`;
  const messageId = `${textareaId}-message`;
  const helperId = `${textareaId}-helper`;
  const counterId = `${textareaId}-counter`;

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

  return (
    <div className={cn("group/field w-full", disabled && "cursor-not-allowed opacity-55", className)}>
      {label ? (
        <label htmlFor={textareaId} className={cn(LABEL_CLASS, "mb-2")}>
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={handleChange}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={cn(
          "block w-full resize-y py-2.5 text-[15px] leading-7 text-[var(--text-main)] outline-none transition-[border-color,box-shadow] duration-300",
          "border-[var(--border)] placeholder:text-[color-mix(in_oklab,var(--text-light)_55%,transparent)]",
          "hover:not-focus:border-[color-mix(in_oklab,var(--text-light)_60%,transparent)] focus:border-[var(--primary-color)] disabled:cursor-not-allowed",
          APPEARANCE_CLASS[appearance],
          hasError && "border-[var(--destructive)] hover:not-focus:border-[var(--destructive)]",
          textareaClassName,
        )}
        {...props}
      />

      {hasBottom ? (
        <div className="mt-1.5 flex items-start justify-between gap-4 text-xs leading-5">
          <div className="min-w-0 space-y-0.5">
            {errorMessage ? (
              <p id={messageId} role="alert" className="flex items-start gap-1.5 text-[var(--destructive)] motion-safe:animate-shake">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            ) : null}
            {helperText ? (
              <p id={helperId} className="text-[var(--text-light)]">
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
                "shrink-0 tabular-nums text-[var(--text-light)]",
                maxLength !== undefined && currentValue.length >= maxLength && "text-[var(--destructive)]",
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
