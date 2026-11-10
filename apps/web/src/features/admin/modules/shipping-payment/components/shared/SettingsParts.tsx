"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminInfoTip, AdminSwitch } from "@/features/admin/core/ui";

/** Thẻ cấu hình: tiêu đề + mô tả ngắn, nút / công tắc bên phải */
export function SettingsCard({
  title,
  description,
  aside,
  children,
  className,
  id,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn(ADMIN_CARD_CLASS, "scroll-mt-28 p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-[#71717A]">{description}</p>}
        </div>
        {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

/** Một dòng bật / tắt: nhãn + giải thích bên trái, công tắc bên phải */
export function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Ô phụ hiện khi bật (VD ngưỡng, phí) */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-3.5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#3F3F46]">{label}</p>
          {hint && <p className="mt-0.5 text-xs leading-relaxed text-[#71717A]">{hint}</p>}
        </div>
        <AdminSwitch checked={checked} onChange={onChange} label={label} disabled={disabled} />
      </div>
      {checked && children && <div className="mt-3">{children}</div>}
    </div>
  );
}

/** Nhãn nhỏ + ⓘ cho ô trong lưới số liệu */
export function MiniLabel({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-xs text-[#71717A]">
      {children}
      {hint && <AdminInfoTip content={hint} />}
    </span>
  );
}

/** Số tiền đọc từ chuỗi đã mask (bỏ mọi ký tự không phải số) */
export const parseDigits = (raw: string): number | null => (raw.replace(/\D/g, "") ? Number(raw.replace(/\D/g, "")) : null);
/** Giá trị cho ô có `mask="currency"`: truyền chuỗi số thô — mask tự thêm dấu ngăn cách (chuỗi đã có dấu "." bị hiểu là phần thập phân) */
export const formatDigits = (value: number | null) => (value === null ? "" : String(value));
