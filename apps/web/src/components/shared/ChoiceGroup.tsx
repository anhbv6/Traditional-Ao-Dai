"use client";

import React, { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  /** Phần tử đầu thẻ (icon, ô màu, hình minh hoạ nhỏ) */
  leading?: React.ReactNode;
  /** Thông tin phụ bên phải (VD "+300.000 ₫", "+5 ngày") */
  meta?: React.ReactNode;
  disabled?: boolean;
}

interface ChoiceGroupProps<T extends string> {
  /** Nhãn cho trình đọc màn hình (legend) */
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Số cột từ tablet trở lên (mobile luôn 1 cột; `chips` thì tự xuống dòng) */
  columns?: 1 | 2 | 3 | 4;
  /** `card`: thẻ có mô tả + ô chọn vuông; `chip`: nhãn gọn một dòng */
  variant?: "card" | "chip";
  /** Ẩn legend (đã có tiêu đề khối bên ngoài) */
  hideLabel?: boolean;
  className?: string;
}

const COLUMN_CLASS: Record<NonNullable<ChoiceGroupProps<string>["columns"]>, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
};

/**
 * Nhóm lựa chọn một (radio thật, ẩn bằng sr-only → dùng phím mũi tên, đọc được bằng trình đọc màn hình).
 * Ngôn ngữ thẻ của storefront: vuông góc, viền mảnh; chọn → viền đỏ đô, nền phủ nhẹ, ô vuông đặc + ✓.
 * Dùng cho phương thức thanh toán, tuỳ chọn may áo dài…
 */
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  columns = 1,
  variant = "card",
  hideLabel = true,
  className,
}: ChoiceGroupProps<T>) {
  const name = useId();

  return (
    <fieldset className={className}>
      <legend className={hideLabel ? "sr-only" : "mb-3 text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]"}>{label}</legend>
      <div className={variant === "chip" ? "flex flex-wrap gap-2" : cn("grid gap-3", COLUMN_CLASS[columns])}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <label key={option.value} className={cn("block", option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              {variant === "chip" ? (
                <span
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 border px-3.5 text-[13px] transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ring)]",
                    isSelected
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                      : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[var(--primary-color)]",
                  )}
                >
                  {option.leading}
                  {option.label}
                  {option.meta ? <span className={cn("text-[11px]", isSelected ? "text-white/75" : "text-[var(--text-light)]")}>{option.meta}</span> : null}
                </span>
              ) : (
                <span
                  className={cn(
                    "flex h-full items-start gap-3.5 border px-4 py-4 transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ring)]",
                    isSelected
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5"
                      : "border-[var(--border)] hover:border-[var(--primary-color)]/50",
                  )}
                >
                  {option.leading ? (
                    <span className={cn("mt-0.5 shrink-0", isSelected ? "text-[var(--primary-ink)]" : "text-[var(--text-light)]")}>{option.leading}</span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-sm font-semibold text-[var(--text-main)]">{option.label}</span>
                      {option.meta ? <span className="text-xs text-[var(--primary-ink)]">{option.meta}</span> : null}
                    </span>
                    {option.description ? (
                      <span className="mt-1 block text-xs leading-5 text-[var(--text-light)]">{option.description}</span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-5 shrink-0 place-items-center border transition-colors duration-300",
                      isSelected ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white" : "border-[var(--border)]",
                    )}
                  >
                    {isSelected ? <Check size={12} strokeWidth={2.4} /> : null}
                  </span>
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
