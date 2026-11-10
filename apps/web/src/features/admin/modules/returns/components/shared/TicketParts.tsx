"use client";

import { Repeat2, Scissors, ShieldCheck, Shirt, Undo2, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminStatusText, type AdminStatusTone } from "@/features/admin/core/ui";
import { type AfterSalesService, type AfterSalesTicket, type TicketStatus } from "../../types/returns.types";

export const SERVICE_ICONS: Record<AfterSalesService, LucideIcon> = {
  ALTERATION: Scissors,
  EXCHANGE: Repeat2,
  RETURN: Undo2,
  WARRANTY: ShieldCheck,
};

const STATUS_TONE: Record<TicketStatus, AdminStatusTone> = {
  NEW: "warning",
  ACCEPTED: "neutral",
  RECEIVED: "neutral",
  READY: "success",
  DONE: "success",
  REJECTED: "danger",
};

/** Trạng thái phiếu — "Chờ hoàn tiền" thay cho "Xong, chờ trả" khi là phiếu trả hàng */
export function TicketStatusText({ ticket }: { ticket: AfterSalesTicket }) {
  const t = useTranslations("AdminPage.returns");
  const key = ticket.status === "READY" && ticket.service === "RETURN" ? "READY_REFUND" : ticket.status;
  return <AdminStatusText tone={STATUS_TONE[ticket.status]}>{t(`status.${key}`)}</AdminStatusText>;
}

/** Ô icon loại yêu cầu — đơn sắc, viền mảnh */
export function ServiceMark({ service, className }: { service: AfterSalesService; className?: string }) {
  const Icon = SERVICE_ICONS[service];
  return (
    <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-full border border-[#E4E4E7] text-[#52525B]", className)}>
      <Icon size={15} />
    </span>
  );
}

/** Ảnh dọc 3:4 của món */
export function TicketThumb({ image, className }: { image: string | null; className?: string }) {
  return (
    <span className={cn("grid aspect-[3/4] w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F4F5] ring-1 ring-[#E4E4E7]/70", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm do admin nhập (URL tùy ý), không qua next/image
        <img src={image} alt="" className="size-full object-contain" />
      ) : (
        <Shirt size={16} className="text-[#A1A1AA]" aria-hidden />
      )}
    </span>
  );
}
