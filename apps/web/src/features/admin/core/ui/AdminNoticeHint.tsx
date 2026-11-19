"use client";

import { type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnchorPositionMethod } from "@/hooks/useAnchorPositionMethod";

export interface AdminNotice {
  /** `warn`: cảnh báo cần xử lý · `info`: còn thiếu dữ liệu / lưu ý */
  tone: "warn" | "info";
  text: string;
}

export interface AdminNoticeHintProps {
  /** Danh sách các cảnh báo / lưu ý cần hiển thị */
  notices: AdminNotice[];
  /** Tiêu đề trong popup popover */
  title?: ReactNode;
  /** Nội dung hiển thị khi không có thông báo nào */
  emptyText?: ReactNode;
  /** Nhãn aria cho trigger button */
  ariaLabel?: string;
  className?: string;
}

/**
 * Icon ⓘ dùng chung ở góc tiêu đề thẻ (aside của Section) thay cho khối cảnh báo:
 * Màu theo mức nặng nhất (xám = ổn · hổ phách = còn thiếu dữ liệu · đỏ hồng = có cảnh báo),
 * kèm chấm tròn thông báo ở góc icon khi có lưu ý. Rê chuột / focus / chạm để xem danh sách.
 */
export function AdminNoticeHint({
  notices,
  title,
  emptyText,
  ariaLabel,
  className,
}: AdminNoticeHintProps) {
  const { positionMethod, captureAnchor } = useAnchorPositionMethod();
  const hasWarn = notices.some((notice) => notice.tone === "warn");
  const hasInfo = notices.length > 0;

  return (
    <Popover.Root onOpenChange={(open, details) => open && captureAnchor(details.event)}>
      <Popover.Trigger
        openOnHover
        delay={80}
        closeDelay={150}
        aria-label={ariaLabel}
        className={cn(
          "relative -m-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-full outline-none transition-colors hover:bg-[#F4F4F5] focus-visible:ring-2 focus-visible:ring-[#18181B]/15 data-popup-open:bg-[#F4F4F5]",
          hasWarn ? "text-rose-600" : hasInfo ? "text-amber-500" : "text-[#A1A1AA]",
          className
        )}
      >
        <Info size={16} aria-hidden />
        {hasInfo && (
          <span
            aria-hidden
            className={cn(
              "absolute right-1 top-1 size-1.5 rounded-full ring-2 ring-white",
              hasWarn ? "bg-rose-600" : "bg-amber-500"
            )}
          />
        )}
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
          <Popover.Popup className="admin-shell w-[300px] origin-[var(--transform-origin)] rounded-xl border border-[#E4E4E7] bg-white p-3.5 shadow-[0_16px_40px_-16px_rgba(9,9,11,0.25)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
            {title && (
              <Popover.Title className="mb-2 text-body font-semibold text-[#3F3F46]">
                {title}
                {hasInfo && <span className="ml-1.5 font-mono tabular-nums text-[#09090B]">{notices.length}</span>}
              </Popover.Title>
            )}
            {notices.length === 0 ? (
              emptyText ? (
                <p className="text-xs leading-relaxed text-[#71717A]">{emptyText}</p>
              ) : null
            ) : (
              <ul className="space-y-2">
                {notices.map((notice, index) => (
                  <li key={`${notice.text}-${index}`} className="flex items-start gap-2 text-xs leading-relaxed text-[#3F3F46]">
                    {notice.tone === "warn" ? (
                      <TriangleAlert size={14} className="mt-px shrink-0 text-rose-600" aria-hidden />
                    ) : (
                      <Info size={14} className="mt-px shrink-0 text-amber-500" aria-hidden />
                    )}
                    <span>{notice.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
