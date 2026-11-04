"use client";

import { cn } from "@/lib/utils";

/**
 * Công tắc bật / tắt đơn sắc của admin (bật = nền đen). Dùng độc lập trong bảng / danh sách — cần `label` cho đọc màn hình.
 * Trong form có nhãn bên cạnh thì bọc bằng `<label>` và vẫn truyền `label`.
 */
export function AdminSwitch({
  checked,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#18181B]/25 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[#18181B]" : "bg-[#E4E4E7] hover:bg-[#D4D4D8]",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-5 rounded-full bg-white shadow-xs transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
