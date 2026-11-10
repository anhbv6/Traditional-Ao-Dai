"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ImageIcon, MapPin, Phone, Truck } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
} from "@/features/admin/core/ui";
import { type AfterSalesTicket, type TicketAction } from "../../types/returns.types";
import { SHOP_TIME_ZONE, checkEligibility, primaryStep } from "../../utils/ticketFlow";
import { ServiceMark, TicketStatusText, TicketThumb } from "../shared/TicketParts";
import { type DialogKind } from "./TicketActionDialog";

/** Một phần của phiếu — tiêu đề nhỏ + nội dung, ngăn bằng nét đứt */
function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-t border-dashed border-[#E4E4E7] px-4 py-4 sm:px-5">
      <header className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-body font-semibold text-[#09090B]">{title}</h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="shrink-0 text-[#71717A]">{label}</span>
      <span className="min-w-0 text-right text-[#09090B]">{children}</span>
    </div>
  );
}

interface TicketDetailProps {
  ticket: AfterSalesTicket;
  now: string;
  onBack: () => void;
  onOpenDialog: (kind: DialogKind) => void;
  onAction: (action: TicketAction) => void;
}

/**
 * Phiếu hậu mãi đang mở: đầu phiếu (mã, loại, trạng thái, khách, nút việc kế tiếp) → đối chiếu chính sách tự động →
 * khách mô tả + ảnh → chiếc áo & cách gửi → nhật ký + ghi chú nội bộ. Màn nhỏ có nút quay lại hàng đợi.
 */
export function TicketDetail({ ticket, now, onBack, onOpenDialog, onAction }: TicketDetailProps) {
  const t = useTranslations("AdminPage.returns");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const [note, setNote] = useState("");
  const eligibility = checkEligibility(ticket);
  const step = primaryStep(ticket);
  const dateTime = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: SHOP_TIME_ZONE });
  const day = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "numeric", year: "numeric", timeZone: SHOP_TIME_ZONE });

  // Ngoài phạm vi (áo may đo xin đổi / trả) thì không mời tiếp nhận — chỉ còn từ chối
  const blocked = eligibility.customFitBlocked && ticket.status === "NEW";

  return (
    <article className={cn(ADMIN_CARD_CLASS, "min-w-0")}>
      <header className="px-4 pb-4 pt-4 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex cursor-pointer items-center gap-1 text-xs text-[#71717A] hover:text-[#09090B] @4xl:hidden"
        >
          <ArrowLeft size={13} aria-hidden /> {t("detail.back")}
        </button>
        <div className="flex items-start gap-3">
          <ServiceMark service={ticket.service} className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-lg font-semibold text-[#09090B]">{t(`service.${ticket.service}`)}</span>
              <span className="font-mono text-2xs text-[#71717A]">{ticket.code}</span>
            </p>
            <div className="mt-1 text-sm">
              <TicketStatusText ticket={ticket} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#3F3F46]">
          <span className="font-medium text-[#09090B]">{ticket.customerName}</span>
          <a href={`tel:${ticket.customerPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 font-mono text-xs hover:underline">
            <Phone size={12} aria-hidden /> {ticket.customerPhone}
          </a>
          <span className="text-xs text-[#71717A]">
            {t("detail.order")} <span className="font-mono text-2xs text-[#3F3F46]">{ticket.orderCode}</span>
          </span>
        </div>

        {(step || ticket.status === "NEW") && (
          <div className="mt-4 flex flex-wrap gap-2">
            {step && !blocked && (
              <button type="button" onClick={() => onOpenDialog(step)} className={ADMIN_PRIMARY_BUTTON_CLASS}>
                {t(`step.${step}`)} <ArrowRight size={14} aria-hidden />
              </button>
            )}
            {ticket.status === "NEW" && (
              <button type="button" onClick={() => onOpenDialog("REJECT")} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                {t("step.REJECT")}
              </button>
            )}
          </div>
        )}
      </header>

      <Section title={t("detail.policy")}>
        <Row label={t("detail.delivered")}>{t("detail.deliveredValue", { date: day(ticket.deliveredAt), days: eligibility.daysSinceDelivery })}</Row>
        <Row label={t("detail.window", { service: t(`service.${ticket.service}`) })}>
          {eligibility.inWindow ? (
            <span className="text-emerald-700">{t("detail.inWindow", { days: eligibility.windowDays })}</span>
          ) : (
            <span className="text-rose-600">{t("detail.outWindow", { days: eligibility.daysSinceDelivery - eligibility.windowDays })}</span>
          )}
        </Row>
        {ticket.service === "RETURN" && <Row label={t("detail.refundAmount")}>{formatVnd(ticket.itemPrice, locale)}</Row>}
        {ticket.fee > 0 && <Row label={t("detail.fee")}>{formatVnd(ticket.fee, locale)}</Row>}
        {eligibility.customFitBlocked && <p className="mt-2 text-xs text-rose-600">{t("detail.customFitBlocked")}</p>}
        {!eligibility.inWindow && !eligibility.customFitBlocked && (
          <p className="mt-2 text-xs text-amber-700">{t(`detail.outWindowHint.${ticket.service}`)}</p>
        )}
      </Section>

      <Section title={t("detail.customerSays")} aside={<span className="text-xs text-[#71717A]">{dateTime(ticket.createdAt)}</span>}>
        <p className="text-sm font-medium text-[#09090B]">{t(`reason.${ticket.service}.${ticket.reason}`)}</p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#3F3F46]">{ticket.description}</p>
        {ticket.photoCount > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("detail.photos", { count: ticket.photoCount })}>
            {Array.from({ length: ticket.photoCount }, (_, index) => (
              <li key={index} className="grid size-14 place-items-center rounded-lg bg-[#F4F4F5] text-[#A1A1AA] ring-1 ring-[#E4E4E7]/70">
                <ImageIcon size={16} aria-hidden />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("detail.garment")}>
        <div className="flex gap-3">
          <TicketThumb image={ticket.image} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-[#09090B]">{ticket.productName}</p>
            <p className="text-xs text-[#71717A]">
              {[ticket.variantName, ticket.isCustomFit ? t("detail.customFit") : null].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#3F3F46]">
              {ticket.handover === "STORE" ? <MapPin size={12} aria-hidden /> : <Truck size={12} aria-hidden />}
              {t(`handover.${ticket.handover}`)}
              {ticket.trackingCode && <span className="font-mono text-2xs text-[#71717A]">· {ticket.trackingCode}</span>}
            </p>
            {ticket.appointmentAt && (
              <p className="mt-1 text-xs text-[#3F3F46]">{t("detail.appointment", { date: day(ticket.appointmentAt) })}</p>
            )}
          </div>
        </div>
      </Section>

      <Section title={t("detail.log")}>
        <ol className="space-y-3">
          {ticket.events.map((event) => (
            <li key={event.id} className="flex gap-3 text-sm">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#A1A1AA]" />
              <div className="min-w-0">
                <p className="text-[#09090B]">
                  {t(`event.${event.kind}`)}
                  <span className="ml-1.5 text-xs text-[#71717A]">
                    {event.kind === "SUBMITTED" ? ticket.customerName : event.actorName} ·{" "}
                    {format.relativeTime(new Date(event.createdAt), new Date(now))}
                  </span>
                </p>
                {event.note && <p className="mt-0.5 text-[#3F3F46]">{event.note}</p>}
              </div>
            </li>
          ))}
        </ol>

        {/* Ghi chú nội bộ (gọi khách, hẹn lại...) — không đổi trạng thái */}
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!note.trim()) return;
            onAction({ kind: "NOTE", note: note.trim() });
            setNote("");
          }}
        >
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            aria-label={t("detail.notePlaceholder")}
            placeholder={t("detail.notePlaceholder")}
            className={cn(ADMIN_INPUT_CLASS, "h-9 min-w-0 flex-1")}
          />
          <button type="submit" disabled={!note.trim()} className={ADMIN_SECONDARY_BUTTON_CLASS}>
            {t("detail.addNote")}
          </button>
        </form>
      </Section>
    </article>
  );
}
