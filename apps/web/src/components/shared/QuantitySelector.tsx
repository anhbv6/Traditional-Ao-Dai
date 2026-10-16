"use client";

import { Minus, Plus } from "lucide-react";
import Counter from "@/components/effects/Counter";
import { cn } from "@/lib/utils";

/**
 * Ô chọn số lượng dùng chung (trang chi tiết sản phẩm, giỏ mini, giỏ hàng…) — cùng một kiểu:
 * khung vuông viền mảnh, nút − / + hai bên, số ở giữa "cuộn" lên / xuống khi đổi (Counter).
 *
 * - `md`: cỡ trang chi tiết (cao 44 / 48px, đứng cạnh nút "Thêm vào giỏ").
 * - `sm`: cỡ gọn cho danh sách (giỏ mini).
 * Controlled: truyền `value` + `onChange`; tự chặn trong khoảng [min, max] và khoá nút ở hai đầu.
 *
 * @example
 * <QuantitySelector value={qty} onChange={setQty} max={MAX_LINE_QUANTITY}
 *   labels={{ decrease: t("quantity.decrease"), increase: t("quantity.increase") }} />
 */
interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  /** Nhãn cho trình đọc màn hình (đã dịch) */
  labels: { decrease: string; increase: string };
  /** Màu nền ô — cũng là màu dải mờ trên / dưới của số cuộn (khớp nền nơi đặt) */
  background?: string;
  className?: string;
}

const SIZE = {
  md: {
    box: "h-11 w-[30%] px-1.5 sm:h-12 sm:w-32 sm:px-3",
    icon: 14,
    font: 14,
    digitBox: "min-w-[1.25rem] sm:min-w-[2rem]",
  },
  sm: {
    box: "h-8 w-[92px] px-1",
    icon: 12,
    font: 12,
    digitBox: "min-w-[1.5rem]",
  },
} as const;

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = Number.POSITIVE_INFINITY,
  size = "md",
  labels,
  background = "var(--bg-main)",
  className,
}: QuantitySelectorProps) {
  const config = SIZE[size];
  const change = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  const buttonClass =
    "grid cursor-pointer place-items-center p-1 text-[var(--text-main)] transition-colors hover:text-[var(--primary-ink)] disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div
      className={cn("flex items-center justify-between border border-[var(--border)]", config.box, className)}
      style={{ backgroundColor: background }}
    >
      <button type="button" aria-label={labels.decrease} onClick={() => change(value - 1)} disabled={value <= min} className={buttonClass}>
        <Minus size={config.icon} />
      </button>
      <div
        aria-live="polite"
        className={cn("flex items-center justify-center text-center font-semibold text-[var(--text-main)] select-none", config.digitBox)}
      >
        <Counter
          value={value}
          fontSize={config.font}
          padding={1}
          textColor="var(--text-main)"
          gradientFrom={background}
          gradientTo="transparent"
          gradientHeight={2}
          fontWeight="600"
          counterStyle={{ fontFamily: "var(--font-lora), 'Lora', serif" }}
        />
      </div>
      <button type="button" aria-label={labels.increase} onClick={() => change(value + 1)} disabled={value >= max} className={buttonClass}>
        <Plus size={config.icon} />
      </button>
    </div>
  );
}
