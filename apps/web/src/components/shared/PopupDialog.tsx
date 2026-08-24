"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PopupSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";

export interface PopupDialogProps {
  /** Trạng thái đóng/mở popup (controlled) */
  open?: boolean;
  /** Hàm callback khi trạng thái đóng/mở thay đổi */
  onOpenChange?: (open: boolean) => void;
  /** Nút hoặc phần tử kích hoạt mở popup (trigger) */
  trigger?: React.ReactNode;
  /** Tiêu đề popup */
  title?: React.ReactNode;
  /** Mô tả phụ dưới tiêu đề */
  description?: React.ReactNode;
  /** Nội dung bên trong popup */
  children?: React.ReactNode;
  /** Phần footer dưới cùng (chứa nút hành động hoặc custom JSX) */
  footer?: React.ReactNode;
  /** Kích thước chiều rộng của popup trên desktop */
  size?: PopupSize;
  /** Tự động bật cuộn khi nội dung dài vượt quá màn hình */
  scrollable?: boolean;
  /** Hiển thị nút đóng (X) ở góc phải (mặc định: true) */
  showCloseButton?: boolean;
  /** Class tùy biến cho DialogContent container */
  className?: string;
  /** Class tùy biến cho vùng chứa nội dung (body) */
  bodyClassName?: string;
  /** Class tùy biến cho header */
  headerClassName?: string;
  /** Class tùy biến cho footer */
  footerClassName?: string;
}

const SIZE_CLASSES: Record<PopupSize, string> = {
  sm: "sm:!max-w-sm sm:!w-full",
  md: "sm:!max-w-md sm:!w-full",
  lg: "sm:!max-w-lg sm:!w-full",
  xl: "sm:!max-w-xl sm:!w-full",
  "2xl": "sm:!max-w-2xl sm:!w-full",
  "3xl": "sm:!max-w-3xl sm:!w-full",
  "4xl": "sm:!max-w-4xl sm:!w-full",
  "5xl": "sm:!max-w-5xl sm:!w-full",
  full: "sm:!max-w-[95vw] sm:!w-[95vw]",
};

export function PopupDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
  scrollable = false,
  showCloseButton = true,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
}: PopupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        React.isValidElement(trigger) ? (
          <DialogTrigger render={trigger} />
        ) : (
          <DialogTrigger>{trigger}</DialogTrigger>
        )
      )}

      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          "!flex flex-col !w-[88vw] !max-w-[88vw] sm:!w-full !h-[75vh] !max-h-[80vh] sm:!h-auto sm:!max-h-[85vh] gap-3 p-4 sm:p-6 sm:gap-4 overflow-hidden rounded-2xl",
          SIZE_CLASSES[size],
          className
        )}
      >
        {(title || description) && (
          <DialogHeader className={cn("shrink-0 pr-6 sm:pr-0", headerClassName)}>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}

        <div
          data-lenis-prevent
          className={cn(
            "w-full flex-1 min-h-0",
            scrollable && "overflow-y-auto overscroll-contain touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            bodyClassName
          )}
        >
          {children}
        </div>

        {footer && (
          <DialogFooter className={cn("shrink-0", footerClassName)}>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PopupDialog;
