import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type AdminButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost"
  | "outline-danger";

export type AdminButtonSize = "xs" | "sm" | "md" | "lg" | "icon-sm" | "icon-md";

export interface AdminButtonProps extends ComponentProps<"button"> {
  /** Biến thể màu sắc & ngữ nghĩa của nút */
  variant?: AdminButtonVariant;
  /** Kích thước nút: xs (28px), sm (32px), md (36px - mặc định), lg (40px), hoặc icon vuông */
  size?: AdminButtonSize;
  /** Biểu tượng lucide-react */
  icon?: ReactNode;
  /** Vị trí hiển thị biểu tượng: đầu (start) hoặc cuối (end) */
  iconPosition?: "start" | "end";
  /** Trạng thái đang tải: hiện spinner, tự động khóa nút */
  loading?: boolean;
  /** Chữ hiển thị khi đang tải (tùy chọn) */
  loadingText?: string;
  /** Chiếm toàn bộ chiều ngang (100% width) */
  fullWidth?: boolean;
  /** Phím tắt gợi ý (hiển thị tag kbd nhỏ bên cạnh chữ, VD: "⌘S", "Esc") */
  shortcut?: string;
  /** Nếu truyền href, nút sẽ tự động chuyển thành Link điều hướng Next.js */
  href?: string;
  onClick?: () => void;
}

const VARIANT_CLASS: Record<AdminButtonVariant, string> = {
  // Nút chính: đen zinc-900, hover đen tuyền, đổ bóng nhẹ
  primary:
    "bg-[#18181B] text-white shadow-2xs hover:bg-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/20 active:bg-black",
  // Nút phụ: viền xám, nền trắng, hover nền sáng
  secondary:
    "border border-[#E4E4E7] bg-white text-[#3F3F46] shadow-2xs hover:bg-[#FAFAFA] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/10 active:bg-[#F4F4F5]",
  // Nút nguy hiểm: đỏ cảnh báo (xóa, hủy, khóa tài khoản)
  danger:
    "bg-rose-600 text-white shadow-2xs hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-600/20 active:bg-rose-800",
  // Nút thành công: xanh lá (phê duyệt, xác nhận tiền vào, lưu thành công)
  success:
    "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600/20 active:bg-emerald-800",
  // Nút trong suốt: dùng cho thanh công cụ, icon hàng bảng, thao tác phụ
  ghost:
    "bg-transparent text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/10 active:bg-[#E4E4E7]",
  // Nút viền đỏ nhẹ: cảnh báo nhưng không chiếm spotlight
  "outline-danger":
    "border border-rose-200 bg-white text-rose-600 shadow-2xs hover:bg-rose-50 hover:border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-600/10 active:bg-rose-100",
};

const SIZE_CLASS: Record<AdminButtonSize, string> = {
  xs: "h-7 px-2 text-xs rounded-md gap-1",
  sm: "h-8 px-2.5 text-xs rounded-lg gap-1.5",
  md: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
  lg: "h-10 px-4 text-sm rounded-xl gap-2",
  "icon-sm": "size-8 p-0 rounded-lg shrink-0 justify-center",
  "icon-md": "size-9 p-0 rounded-lg shrink-0 justify-center",
};

const SPINNER_SIZE: Record<AdminButtonSize, string> = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-4",
  "icon-sm": "size-4",
  "icon-md": "size-4",
};

/**
 * Hàm sinh chuỗi class cho nút Admin — dùng khi cần gắn class vào element ngoài hoặc component khác
 */
export function adminButtonClass({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center font-medium transition-colors select-none outline-none disabled:cursor-not-allowed disabled:opacity-50",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth && "w-full",
    className
  );
}

/**
 * Component Button chuyên dụng cho Khu vực Quản trị (Admin Portal).
 * Thiết kế theo chuẩn giao diện đơn sắc (Monochrome), hỗ trợ đa dạng biến thể,
 * kích thước, icon, loading spinner, phím tắt và tự động chuyển thành Link khi có href.
 */
export function AdminButton({
  type = "button",
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "start",
  loading = false,
  loadingText,
  fullWidth = false,
  shortcut,
  href,
  disabled,
  className,
  children,
  onClick,
  ...props
}: AdminButtonProps) {
  const isIconOnly = size === "icon-sm" || size === "icon-md";
  const isDisabled = disabled || loading;

  const buttonClasses = adminButtonClass({
    variant,
    size,
    fullWidth,
    className,
  });

  const content = (
    <>
      {loading && (
        <Spinner className={cn(SPINNER_SIZE[size], "shrink-0")} aria-hidden="true" />
      )}
      {!loading && icon && iconPosition === "start" && (
        <span className="shrink-0 flex items-center">{icon}</span>
      )}
      {loading && loadingText ? (
        <span>{loadingText}</span>
      ) : (
        !isIconOnly && children && <span>{children}</span>
      )}
      {!loading && icon && iconPosition === "end" && (
        <span className="shrink-0 flex items-center">{icon}</span>
      )}
      {shortcut && !loading && !isIconOnly && (
        <kbd className="ml-1 inline-flex items-center rounded border border-current/20 px-1 font-mono text-[10px] font-normal leading-none opacity-70">
          {shortcut}
        </kbd>
      )}
    </>
  );

  // Nếu truyền href và không bị disabled -> render Link điều hướng
  if (href && !isDisabled) {
    return (
      <Link href={href} className={buttonClasses} aria-label={props["aria-label"]}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={buttonClasses}
      aria-busy={loading}
      {...props}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
