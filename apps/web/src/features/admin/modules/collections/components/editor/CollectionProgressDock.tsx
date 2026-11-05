"use client";

import { useState, type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type CollectionStatus } from "../../types/collections.types";
import { COLLECTION_STATUS_META } from "../../utils/collectionStatusMeta";
import { AdminTooltip } from "@/features/admin/core/ui";

/** Màu quầng sáng theo mức cần chú ý — dùng màu ngữ nghĩa trạng thái của admin (§8) */
const GLOW_CLASS = {
  warn: "bg-rose-500",
  info: "bg-amber-400",
  ok: "bg-emerald-400",
} as const;

/**
 * Nút nổi "Tiến trình" cho iPad / điện thoại (dưới `xl`), xếp ngay trên nút trợ lý AI.
 * Cột phải không đủ chỗ ở màn hẹp nên thẻ Tiến trình chuyển vào popover; nút có quầng sáng nháy liên tục
 * để người dùng biết còn một bảng điều khiển ở đây.
 * `children` nhận hàm `close` — gọi khi bấm thao tác mở dialog để popover không đè lên dialog.
 */
export function CollectionProgressDock({
  status,
  tone,
  title,
  aside,
  children,
}: {
  status: CollectionStatus;
  /** Mức cần chú ý của bộ sưu tập: quyết định màu quầng sáng */
  tone: keyof typeof GLOW_CLASS;
  title: string;
  /** Góc phải tiêu đề popover (icon cảnh báo) */
  aside?: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const t = useTranslations("AdminPage.collections");
  const [open, setOpen] = useState(false);
  const { icon: StatusIcon } = COLLECTION_STATUS_META[status];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {/* Khung cố định chứa quầng sáng + nút: quầng nằm SAU nút nên không nhuộm màu mặt nút trắng */}
      <div className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.75rem)] right-4 z-40 size-12 sm:bottom-[4.75rem] sm:right-5 xl:hidden">
        {!open && (
          <span
            aria-hidden
            className={cn("absolute inset-0 rounded-full opacity-50 motion-safe:animate-ping", GLOW_CLASS[tone])}
          />
        )}
        {/* Mở popover thì nút thu nhỏ + mờ đi như nút trợ lý AI (popover mở đè đúng chỗ nút) */}
        <AdminTooltip content={t("editor.progressOpen")} disabled={open} side="left">
          <Popover.Trigger
            aria-label={t("editor.progressOpen")}
            className="relative grid size-full cursor-pointer place-items-center rounded-full border border-[#E4E4E7] bg-white text-[#09090B] shadow-[0_12px_24px_-12px_rgba(9,9,11,0.45)] outline-none transition-[opacity,scale,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#FAFAFA] focus-visible:ring-4 focus-visible:ring-[#18181B]/15 data-popup-open:pointer-events-none data-popup-open:scale-80 data-popup-open:opacity-0"
          >
            <StatusIcon size={20} strokeWidth={1.8} aria-hidden />
            <span
              aria-hidden
              className={cn("absolute right-0.5 top-0.5 size-2.5 rounded-full ring-2 ring-white", GLOW_CLASS[tone])}
            />
          </Popover.Trigger>
        </AdminTooltip>
      </div>
      <Popover.Portal>
        {/*
          positionMethod="fixed": nút neo là phần tử fixed — định vị theo tài liệu (mặc định) khiến trình duyệt cuộn trang
          tới popover khi focus chuyển vào, làm trang bị nhảy. sideOffset âm = đáy popover trùng đáy nút (đè lên chỗ nút).
        */}
        <Popover.Positioner
          positionMethod="fixed"
          side="top"
          align="end"
          sideOffset={-48}
          collisionPadding={12}
          className="z-50 outline-none"
        >
          <Popover.Popup className="admin-shell max-h-[calc(100dvh-9rem)] w-[min(340px,calc(100vw-2rem))] origin-bottom-right overflow-y-auto overscroll-contain rounded-2xl border border-[#E4E4E7] bg-white p-4 shadow-[0_24px_48px_-24px_rgba(9,9,11,0.35)] outline-none transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0">
            <div className="mb-4 flex items-center gap-2">
              <Popover.Title className="mr-auto text-lg font-semibold text-[#09090B]">{title}</Popover.Title>
              {aside}
              {/* Nút mở đã ẩn khi popover mở nên cần nút đóng riêng */}
              <Popover.Close
                aria-label={t("editor.progressClose")}
                className="-mr-1.5 grid size-8 cursor-pointer place-items-center rounded-lg text-[#71717A] outline-none transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/15"
              >
                <X size={16} aria-hidden />
              </Popover.Close>
            </div>
            {children(() => setOpen(false))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
