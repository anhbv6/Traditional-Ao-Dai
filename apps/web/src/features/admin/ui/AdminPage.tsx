import React, { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hệ thống giao diện khu vực quản trị (Admin Design System).
 * Mọi màn admin dùng chung các thành phần dưới đây để đồng bộ khung trang, header, card, trạng thái rỗng.
 * Quy chuẩn màu & chữ: app/[locale]/(admin)/admin/variables.md
 */

/** Lớp chuẩn cho card / panel / bảng dữ liệu của admin */
export const ADMIN_CARD_CLASS = "rounded-xl border border-[#E4E4E7] bg-white shadow-2xs";

/**
 * Khung nội dung một trang admin: cùng chiều rộng tối đa, lề và khoảng cách giữa các khối
 */
export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1440px] space-y-6 px-5 py-8 sm:px-8 lg:px-12", className)}>{children}</div>;
}

interface AdminPageHeaderProps {
  /** Icon nhóm chức năng hiển thị cạnh eyebrow */
  icon: LucideIcon;
  /** Nhãn nhóm nhỏ phía trên tiêu đề */
  eyebrow: string;
  title: string;
  description?: string;
  /** Thông tin tóm tắt (ví dụ "12 đơn hàng") hiển thị bên phải khi không có actions */
  meta?: ReactNode;
  /** Bộ lọc / nút thao tác bên phải */
  actions?: ReactNode;
}

/**
 * Header thống nhất cho mọi trang admin: eyebrow + tiêu đề + mô tả, bên phải là meta hoặc actions
 */
export function AdminPageHeader({ icon: Icon, eyebrow, title, description, meta, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#E4E4E7] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.5px] text-[#71717A]">
          <Icon size={14} aria-hidden="true" />
          <span>{eyebrow}</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#09090B]">{title}</h1>
        {description && <p className="mt-1 text-xs text-[#71717A]">{description}</p>}
      </div>
      {(actions || meta) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-[#71717A]">{actions ?? meta}</div>
      )}
    </div>
  );
}

/**
 * Số liệu nổi bật trong meta của header (font mono theo quy chuẩn KPI)
 */
export function AdminMetaValue({ children }: { children: ReactNode }) {
  return <span className="font-mono font-bold text-[#09090B]">{children}</span>;
}

/**
 * Nhóm nút lọc dạng segmented control (dùng cho bộ lọc trạng thái / thời gian)
 */
export function AdminSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex select-none gap-1 rounded-lg border border-[#E4E4E7] bg-white p-1 shadow-2xs">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.5px] transition-all duration-200 disabled:cursor-default",
            value === option.value ? "bg-[#18181B] text-white shadow-2xs" : "text-[#71717A] hover:text-[#09090B]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Nút phụ (làm mới, thao tác phụ) cùng kiểu cho mọi trang
 */
export function AdminSecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 text-xs font-semibold text-[#3F3F46] shadow-2xs transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
