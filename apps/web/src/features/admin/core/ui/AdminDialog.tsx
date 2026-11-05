"use client";

import { type FormEvent, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ADMIN_DANGER_BUTTON_CLASS, ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from "./adminButtons";

/** Nút ở chân dialog admin — cùng bộ nút với toàn khu quản trị (adminButtons.ts) */
export const ADMIN_DIALOG_PRIMARY_BUTTON_CLASS = ADMIN_PRIMARY_BUTTON_CLASS;
export const ADMIN_DIALOG_SECONDARY_BUTTON_CLASS = ADMIN_SECONDARY_BUTTON_CLASS;
export const ADMIN_DIALOG_DANGER_BUTTON_CLASS = ADMIN_DANGER_BUTTON_CLASS;

/** Vùng thân cuộn được — dùng khi `bare` (tự dựng form có thân + chân riêng) */
export const ADMIN_DIALOG_BODY_CLASS = "min-h-0 flex-1 overflow-y-auto px-5 py-5";

const SIZE_CLASS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  /** Xem trước cỡ lớn: gần kín màn hình, cao cố định */
  full: "h-[92dvh] max-w-[calc(100%-1.5rem)] sm:max-w-[min(1280px,calc(100%-3rem))]",
} as const;

/** Đường phân cách nét đứt giữa các phần — cùng kiểu với thẻ menu trái và thẻ ghi chú */
export function AdminDialogDivider() {
  return <div aria-hidden className="mx-5 shrink-0 border-t border-dashed border-[#E4E4E7]" />;
}

/** Chân dialog (nét đứt + hàng nút căn phải) — dùng trực tiếp khi `bare` */
export function AdminDialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <AdminDialogDivider />
      <div className={cn("flex shrink-0 flex-wrap items-center justify-end gap-2 px-5 py-4", className)}>
        {children}
      </div>
    </>
  );
}

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** `danger`: thao tác xóa / không hoàn tác — icon đỏ hồng (nút chính dùng ADMIN_DIALOG_DANGER_BUTTON_CLASS) */
  tone?: "default" | "danger";
  /** Phần tử bên phải tiêu đề, trước nút đóng (VD chuyển desktop / mobile) */
  headerAside?: ReactNode;
  /** Vùng cố định ngay dưới đầu dialog, không cuộn theo thân (VD ô tìm kiếm, tab) */
  toolbar?: ReactNode;
  children: ReactNode;
  /** Các nút ở chân dialog (căn phải; thêm `mr-auto` cho phần tử muốn dạt trái) — bỏ trống thì không có chân */
  footer?: ReactNode;
  /** Truyền vào thì thân + chân nằm trong một `<form>` (Enter để gửi, nút `type="submit"` trong footer) */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /**
   * Tự dựng phần dưới đầu dialog (VD form có thân cuộn + chân riêng): children được đặt thẳng vào khung cột,
   * dùng ADMIN_DIALOG_BODY_CLASS + AdminDialogFooter để giữ đúng kiểu
   */
  bare?: boolean;
  size?: keyof typeof SIZE_CLASS;
  bodyClassName?: string;
  className?: string;
}

/**
 * Khung dialog DUY NHẤT của khu quản trị (AGENTS.md §8): icon tròn + tiêu đề + mô tả + nút đóng ở đầu,
 * thân tự cuộn khi dài, nút thao tác ở chân; các phần ngăn bằng nét đứt. Portal đã gắn `admin-shell`.
 */
export function AdminDialog({
  open,
  onOpenChange,
  icon: Icon,
  title,
  description,
  tone = "default",
  headerAside,
  toolbar,
  children,
  footer,
  onSubmit,
  bare = false,
  size = "md",
  bodyClassName,
  className,
}: AdminDialogProps) {
  const t = useTranslations("AdminPage.dialog");

  const main = bare ? (
    children
  ) : (
    <>
      <div className={cn(ADMIN_DIALOG_BODY_CLASS, bodyClassName)}>{children}</div>
      {footer && <AdminDialogFooter>{footer}</AdminDialogFooter>}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "admin-shell flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white p-0 text-[#09090B] shadow-[0_24px_48px_-24px_rgba(9,9,11,0.35)] ring-0",
          SIZE_CLASS[size],
          className
        )}
      >
        <header className="flex shrink-0 items-start gap-3 px-5 pb-4 pt-5">
          {Icon && <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full border",
              tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-600" : "border-[#E4E4E7] text-[#52525B]"
            )}
          >
            <Icon size={18} aria-hidden />
          </span>}
          <div className="min-w-0 flex-1 pt-0.5">
            <DialogTitle className="text-lg font-semibold leading-tight text-[#09090B]">{title}</DialogTitle>
            {description && (
              <DialogDescription className="mt-1 text-sm leading-relaxed text-[#71717A]">
                {description}
              </DialogDescription>
            )}
          </div>
          {headerAside}
          <DialogClose
            aria-label={t("close")}
            className="-mr-1.5 -mt-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-[#A1A1AA] outline-none transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/15"
          >
            <X size={16} aria-hidden />
          </DialogClose>
        </header>

        <AdminDialogDivider />

        {toolbar && (
          <>
            <div className="shrink-0 px-5 py-3">{toolbar}</div>
            <AdminDialogDivider />
          </>
        )}

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            {main}
          </form>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{main}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
