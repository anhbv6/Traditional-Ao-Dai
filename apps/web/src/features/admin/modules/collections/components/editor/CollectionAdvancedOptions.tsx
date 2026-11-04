"use client";

import { type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { ChevronDown, ChevronRight, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnchorPositionMethod } from "@/hooks/useAnchorPositionMethod";

/**
 * Nút "Tùy chọn nâng cao" ở góc thẻ: rê chuột hoặc bấm để mở bảng chứa các tùy chọn ít dùng
 * (hiện trang chủ, lưu trữ lookbook…) thay vì bày sẵn trên form.
 */
export function CollectionAdvancedOptions({
  label,
  activeCount,
  children,
}: {
  label: string;
  /** Số tùy chọn đang bật — hiện cạnh nhãn để biết có gì đang bật mà không cần mở */
  activeCount: number;
  children: ReactNode;
}) {
  const { positionMethod, captureAnchor } = useAnchorPositionMethod();

  return (
    <Popover.Root onOpenChange={(open, details) => open && captureAnchor(details.event)}>
      <Popover.Trigger
        openOnHover
        delay={100}
        closeDelay={200}
        className="group inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs font-medium text-[#3F3F46] outline-none transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B] focus-visible:border-[#18181B] data-popup-open:border-[#18181B] data-popup-open:text-[#09090B]"
      >
        <SlidersHorizontal size={14} aria-hidden />
        {label}
        {activeCount > 0 && (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#18181B] px-1 font-mono text-2xs font-semibold tabular-nums text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown
          size={13}
          aria-hidden
          className="text-[#A1A1AA] transition-transform duration-200 group-data-popup-open:rotate-180"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          positionMethod={positionMethod}
          side="bottom"
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 outline-none"
        >
          <Popover.Popup
            aria-label={label}
            className="admin-shell w-[320px] origin-[var(--transform-origin)] rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-[0_16px_40px_-16px_rgba(9,9,11,0.25)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0"
          >
            <div className="space-y-4">{children}</div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * Mục bấm trong bảng "Tùy chọn nâng cao" để mở một dialog (ví dụ SEO): bấm thì đóng bảng rồi gọi `onClick`.
 * Đặt sau các công tắc; tự có nét đứt ngăn cách phía trên.
 */
export function CollectionAdvancedAction({
  icon: Icon,
  label,
  description,
  tone = "default",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  /** Dòng trạng thái ngắn, ví dụ "Đã tùy chỉnh" / "Tự lấy từ nội dung" */
  description?: string;
  /** `error`: phần bên trong đang có lỗi cần sửa */
  tone?: "default" | "error";
  onClick: () => void;
}) {
  return (
    <div className="border-t border-dashed border-[#E4E4E7] pt-3">
      <Popover.Close
        onClick={onClick}
        className="group -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-[#F4F4F5] focus-visible:bg-[#F4F4F5]"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#E4E4E7] text-[#52525B]">
          <Icon size={15} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-[#09090B]">{label}</span>
          {description && (
            <span className={cn("block truncate text-xs", tone === "error" ? "text-rose-700" : "text-[#71717A]")}>
              {description}
            </span>
          )}
        </span>
        <ChevronRight size={16} aria-hidden className="shrink-0 text-[#A1A1AA] group-hover:text-[#09090B]" />
      </Popover.Close>
    </div>
  );
}
