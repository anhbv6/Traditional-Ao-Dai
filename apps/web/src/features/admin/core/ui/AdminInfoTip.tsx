"use client";

import { type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAnchorPositionMethod } from "@/hooks/useAnchorPositionMethod";

/**
 * Icon ⓘ nhỏ đặt cạnh nhãn ô nhập: rê chuột / focus / chạm để xem hướng dẫn, thay cho dòng gợi ý dưới ô.
 * Trigger là `<span role="button">` (không phải `<button>`) để đặt được trong `<label>` mà nhãn vẫn gắn đúng với ô nhập.
 * Dùng Popover (mở khi rê chuột) thay vì Tooltip để chạm trên iPad / điện thoại vẫn mở được.
 */
export function AdminInfoTip({ content, className }: { content: ReactNode; className?: string }) {
  const { positionMethod, captureAnchor } = useAnchorPositionMethod();
  const t = useTranslations("AdminPage.infoTip");

  return (
    <Popover.Root onOpenChange={(open, details) => open && captureAnchor(details.event)}>
      <Popover.Trigger
        openOnHover
        delay={80}
        closeDelay={120}
        nativeButton={false}
        aria-label={t("label")}
        render={<span role="button" tabIndex={0} />}
        className={cn(
          "inline-grid ml-1 size-4 shrink-0 cursor-help place-items-center rounded-full text-[#A1A1AA] outline-none transition-colors hover:text-[#52525B] focus-visible:ring-2 focus-visible:ring-[#18181B]/20 data-popup-open:text-[#09090B]",
          className
        )}
      >
        <Info size={14} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          positionMethod={positionMethod}
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 outline-none"
        >
          <Popover.Popup className="admin-shell max-w-[260px] origin-[var(--transform-origin)] rounded-lg bg-[#18181B] px-3 py-2 text-xs leading-relaxed text-white shadow-[0_10px_24px_-12px_rgba(9,9,11,0.5)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
            {content}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
