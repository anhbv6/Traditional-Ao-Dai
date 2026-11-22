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
 * Popover tối giản, tự nhiên, đổ bóng rõ ràng và có mũi tên định vị trực quan.
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
          sideOffset={8}
          collisionPadding={12}
          className="z-50 outline-none"
        >
          <Popover.Popup className="admin-shell w-[290px] origin-[var(--transform-origin)] rounded-xl border border-[#D4D4D8] bg-white p-3.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.06)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
            {/* Mũi tên nhỏ tinh tế trỏ về icon trigger */}
            <Popover.Arrow className="size-2.5 rotate-45 border-l border-t border-[#D4D4D8] bg-white data-[side=bottom]:-top-[5px] data-[side=top]:-bottom-[5px] data-[side=top]:border-l-0 data-[side=top]:border-t-0 data-[side=top]:border-r data-[side=top]:border-b" />

            {/* Tiêu đề phẳng, tự nhiên */}
            {title && (
              <div className="mb-2.5 flex items-center gap-1.5">
                <Popover.Title className="text-xs font-semibold text-[#09090B]">
                  {title}
                </Popover.Title>
                {hasInfo && (
                  <span className="font-mono text-2xs text-[#71717A]">
                    ({notices.length})
                  </span>
                )}
              </div>
            )}

            {/* Danh sách các điều kiện dạng văn bản tự nhiên, không nền/viền hộp thừa */}
            {notices.length === 0 ? (
              emptyText ? (
                <p className="text-xs leading-relaxed text-[#71717A]">{emptyText}</p>
              ) : null
            ) : (
              <ul className="space-y-2">
                {notices.map((notice, index) => (
                  <li
                    key={`${notice.text}-${index}`}
                    className="flex items-start gap-2 text-xs leading-relaxed text-[#3F3F46]"
                  >
                    {notice.tone === "warn" ? (
                      <TriangleAlert size={14} className="mt-0.5 shrink-0 text-rose-600" aria-hidden />
                    ) : (
                      <Info size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
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
