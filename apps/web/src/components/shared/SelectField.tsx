"use client";

import { useId, type ReactNode } from "react";
import { Select } from "@base-ui/react/select";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { FLOATING_COLLISION_PADDING, FLOATING_SURFACE_CLASS, FLOATING_TOP_BAR_CLASS } from "./floatingSurface";

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  label?: ReactNode;
  options: readonly SelectFieldOption[];
  /** `null` = chưa chọn (hiện placeholder) */
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Icon đầu ô (giống `prefix` của TextField) */
  prefix?: ReactNode;
  /** Lỗi: chuỗi = hiện thông báo dưới ô; `true` = chỉ tô viền lỗi */
  error?: ReactNode | boolean;
  helperText?: ReactNode;
  /** Đang tải danh sách: spinner ở cuối ô, khoá chọn */
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** Chiều cao khớp TextField / ActionButton cùng size (sm 36px · md 40px · lg 48px) */
  size?: "sm" | "md" | "lg";
  id?: string;
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<SelectFieldProps["size"]>, string> = {
  sm: "h-9 text-[13px]",
  md: "h-10 text-sm",
  lg: "h-12 text-[15px]",
};

/**
 * Ô chọn một giá trị dùng chung của storefront — cùng ngôn ngữ với TextField `appearance="outline"`
 * (nhãn in hoa nhỏ, khung viền vuông, lỗi hiện dưới ô) và danh sách dùng khung nổi chung (floatingSurface).
 * Dựa trên Base UI Select: phím mũi tên, gõ để tìm, Esc, trả focus, tự lật khi sát mép.
 *
 * @example
 * <SelectField label={t("province")} options={provinces} value={code} onValueChange={setCode} placeholder={t("choose")} />
 */
export function SelectField({
  label,
  options,
  value,
  onValueChange,
  placeholder,
  prefix,
  error,
  helperText,
  loading = false,
  disabled = false,
  required = false,
  size = "md",
  id: idProp,
  className,
}: SelectFieldProps) {
  const autoId = useId();
  const id = idProp ?? `sf-${autoId}`;
  const hasError = Boolean(error);
  const errorMessage = typeof error === "boolean" ? null : error;
  const isDisabled = disabled || loading;
  const selected = options.find((option) => option.value === value);

  return (
    <div data-slot="select-field" data-invalid={hasError || undefined} className={cn("group/field w-full", className)}>
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "block text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)] transition-colors duration-300 group-focus-within/field:text-[var(--primary-ink)]",
            hasError && "text-[var(--destructive)] group-focus-within/field:text-[var(--destructive)]",
            isDisabled && "opacity-55",
          )}
        >
          {label}
          {required ? <span aria-hidden="true" className="ml-1 text-[var(--destructive)]">*</span> : null}
        </label>
      ) : null}

      <Select.Root
        value={value}
        onValueChange={(next) => {
          if (typeof next === "string") onValueChange(next);
        }}
        disabled={isDisabled}
      >
        <Select.Trigger
          id={id}
          aria-invalid={hasError || undefined}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 border bg-[var(--bg-card)] px-3 text-left text-[var(--text-main)] outline-none transition-[border-color,box-shadow] duration-300",
            Boolean(label) && "mt-2",
            SIZE_CLASS[size],
            hasError
              ? "border-[var(--destructive)]"
              : "border-[var(--border)] hover:border-[color-mix(in_oklab,var(--primary-color)_45%,var(--border))] focus-visible:border-[var(--primary-color)] data-[popup-open]:border-[var(--primary-color)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--ring)]/30",
            "disabled:cursor-not-allowed disabled:opacity-55",
          )}
        >
          {prefix ? (
            <span className="flex shrink-0 items-center text-[var(--text-light)] [&_svg:not([class*='size-'])]:size-4">{prefix}</span>
          ) : null}
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-[color-mix(in_oklab,var(--text-light)_55%,transparent)]")}>
            {selected?.label ?? placeholder}
          </span>
          {loading ? (
            <Spinner aria-hidden="true" className="size-4 text-[var(--text-light)]" />
          ) : (
            <Select.Icon className="flex shrink-0 text-[var(--text-light)] transition-transform duration-300 group-has-[[data-popup-open]]/field:rotate-180">
              <ChevronDown className="size-4" />
            </Select.Icon>
          )}
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner
            sideOffset={6}
            alignItemWithTrigger={false}
            collisionPadding={FLOATING_COLLISION_PADDING}
            className="z-[100] outline-none"
          >
            <Select.Popup className={cn(FLOATING_SURFACE_CLASS, "w-[var(--anchor-width)] min-w-40")}>
              <span aria-hidden="true" className={FLOATING_TOP_BAR_CLASS} />
              <Select.List
                data-lenis-prevent
                className="scrollbar-brand max-h-64 overflow-y-auto overscroll-contain py-1.5"
              >
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className="flex cursor-pointer items-center gap-2 px-3.5 py-2 text-[13px] text-[var(--text-main)] outline-none select-none data-[highlighted]:bg-[var(--bg-main)] data-[highlighted]:text-[var(--primary-ink)] data-[selected]:font-semibold data-[selected]:text-[var(--primary-ink)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                  >
                    <Select.ItemText className="min-w-0 flex-1 truncate">{option.label}</Select.ItemText>
                    <Select.ItemIndicator className="flex shrink-0 text-[var(--primary-ink)]">
                      <Check className="size-3.5" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>

      {errorMessage || helperText ? (
        <div className="mt-1.5 space-y-0.5 text-xs leading-5">
          {errorMessage ? (
            <p role="alert" className="flex items-start gap-1.5 text-[var(--destructive)] motion-safe:animate-shake">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          ) : null}
          {helperText ? <p className="text-[var(--text-light)]">{helperText}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
