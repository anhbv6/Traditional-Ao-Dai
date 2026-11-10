"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Inbox, LifeBuoy } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { AFTER_SALES_SERVICES } from "@/features/after-sales";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminFilterSelect, AdminListPanel } from "@/features/admin/core/ui";
import {
  type AfterSalesService,
  type AfterSalesTicket,
  type ReturnsDeskData,
  type TicketAction,
  type TicketStatus,
} from "../../types/returns.types";
import { DESK_TABS, RESPONSE_DUE_DAYS, SHOP_TIME_ZONE, applyTicketAction, checkEligibility, daysInStatus } from "../../utils/ticketFlow";
import { ServiceMark } from "../shared/TicketParts";
import { TicketDetail } from "./TicketDetail";
import { type DialogKind } from "./TicketActionDialog";

const TicketActionDialog = dynamic(() => import("./TicketActionDialog").then((m) => m.TicketActionDialog));

/** Người thực hiện ở bản mock — khi nối DB lấy từ phiên server */
const MOCK_ACTOR = "Quản trị";

/**
 * Bàn tiếp nhận hậu mãi — dạng hộp việc hai khung thay vì bảng phẳng:
 * trái là hàng đợi phiếu theo chỗ chiếc áo đang ở trong quy trình (mới gửi → chờ nhận áo → đang xử lý → chờ trả khách),
 * phải là phiếu đang mở với đối chiếu chính sách và đúng một việc kế tiếp. Khung hẹp: chọn phiếu thì phiếu thay chỗ hàng đợi.
 */
export function ReturnsDesk({ data }: { data: ReturnsDeskData }) {
  const t = useTranslations("AdminPage.returns");
  const tPage = useTranslations("AdminPage.pages.returns");
  const format = useFormatter();
  const notify = useNotify();
  const [tickets, setTickets] = useState(data.tickets);
  const [now, setNow] = useState(data.now);
  const [tab, setTab] = useState<TicketStatus>("NEW");
  const [service, setService] = useState<"ALL" | AfterSalesService>("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);

  const keyword = search.trim().toLowerCase();
  const scoped = tickets.filter(
    (ticket) =>
      (service === "ALL" || ticket.service === service) &&
      (!keyword ||
        [ticket.code, ticket.orderCode, ticket.customerName, ticket.customerPhone, ticket.productName].some((value) =>
          value.toLowerCase().includes(keyword)
        ))
  );
  const counts = Object.fromEntries(DESK_TABS.map((status) => [status, scoped.filter((ticket) => ticket.status === status).length])) as Record<
    TicketStatus,
    number
  >;
  // Cũ nhất lên đầu với các tab còn việc (khách chờ lâu nhất được xử lý trước); tab đã đóng thì mới nhất trước
  const queue = scoped
    .filter((ticket) => ticket.status === tab)
    .sort((a, b) =>
      tab === "DONE" || tab === "REJECTED" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)
    );
  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;

  const act = (ticket: AfterSalesTicket, action: TicketAction) => {
    const at = new Date().toISOString();
    setTickets((prev) => prev.map((item) => (item.id === ticket.id ? applyTicketAction(item, action, MOCK_ACTOR, at) : item)));
    setNow(at);
    setDialog(null);
    notify.success(t(`toast.${action.kind}`, { code: ticket.code }));
  };

  const queueHint = (ticket: AfterSalesTicket) => {
    const eligibility = checkEligibility(ticket);
    const waited = daysInStatus(ticket, now);
    if (eligibility.customFitBlocked) return { text: t("hint.customFit"), tone: "text-rose-600" };
    if (!eligibility.inWindow && ticket.status === "NEW") return { text: t("hint.outWindow"), tone: "text-amber-700" };
    if (ticket.status === "NEW" && waited >= RESPONSE_DUE_DAYS) return { text: t("hint.waiting", { days: waited }), tone: "text-amber-700" };
    if (ticket.appointmentAt && (ticket.status === "ACCEPTED" || ticket.status === "READY")) {
      return {
        text: t("hint.appointment", {
          date: format.dateTime(new Date(ticket.appointmentAt), { weekday: "short", day: "numeric", month: "numeric", timeZone: SHOP_TIME_ZONE }),
        }),
        tone: "text-[#3F3F46]",
      };
    }
    if (ticket.handover === "POST" && ticket.status === "ACCEPTED") return { text: t("hint.inTransit"), tone: "text-[#71717A]" };
    return { text: t("hint.inStatus", { days: waited }), tone: "text-[#71717A]" };
  };

  return (
    <>
      <AdminListPanel
        icon={LifeBuoy}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        filters={
          <AdminFilterSelect
            label={t("filter.service")}
            value={service}
            onChange={setService}
            options={[
              { value: "ALL" as const, label: t("filter.all") },
              ...AFTER_SALES_SERVICES.map((value) => ({ value, label: t(`service.${value}`) })),
            ]}
            className="w-full sm:w-56"
          />
        }
      />

      <div role="tablist" aria-label={t("tabsLabel")} className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#E4E4E7] px-1 [scrollbar-width:none]">
        {DESK_TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => {
              setTab(value);
              setSelectedId(null);
            }}
            className={cn(
              "-mb-px inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-body transition-colors sm:px-4",
              tab === value ? "border-[#18181B] font-semibold text-[#09090B]" : "border-transparent text-[#71717A] hover:text-[#09090B]"
            )}
          >
            {t(`tab.${value}`)}
            <span className={cn("font-mono text-xs tabular-nums", counts[value] === 0 ? "text-[#D4D4D8]" : "text-[#71717A]")}>{counts[value]}</span>
          </button>
        ))}
      </div>

      {/* Hai khung theo bề rộng vùng nội dung (container query) — cột phải admin có thể chiếm chỗ */}
      <div className="@container">
        <div className="grid items-start gap-5 @4xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
          <section className={cn(ADMIN_CARD_CLASS, "overflow-hidden", selected && "hidden @4xl:block")} aria-label={t("queueLabel")}>
            {queue.length === 0 ? (
              <p className="px-5 py-16 text-center text-sm text-[#71717A]">{t(`empty.${tab}`)}</p>
            ) : (
              <ul className="divide-y divide-dashed divide-[#E4E4E7]">
                {queue.map((ticket) => {
                  const hint = queueHint(ticket);
                  const active = ticket.id === selectedId;
                  return (
                    <li key={ticket.id}>
                      <button
                        type="button"
                        aria-current={active || undefined}
                        onClick={() => setSelectedId(ticket.id)}
                        className={cn(
                          "flex w-full cursor-pointer gap-3 px-4 py-3.5 text-left transition-colors",
                          active ? "bg-[#F4F4F5]" : "hover:bg-[#FAFAFA]"
                        )}
                      >
                        <ServiceMark service={ticket.service} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-sm font-medium text-[#09090B]">{ticket.customerName}</p>
                            <time dateTime={ticket.createdAt} className="shrink-0 text-xs text-[#A1A1AA]">
                              {format.relativeTime(new Date(ticket.createdAt), new Date(now))}
                            </time>
                          </div>
                          <p className="truncate text-xs text-[#71717A]">
                            {t(`service.${ticket.service}`)} · {t(`reason.${ticket.service}.${ticket.reason}`)} — {ticket.productName}
                          </p>
                          <p className={cn("mt-1 truncate text-xs", hint.tone)}>{hint.text}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {selected ? (
            <TicketDetail
              key={selected.id}
              ticket={selected}
              now={now}
              onBack={() => setSelectedId(null)}
              onOpenDialog={setDialog}
              onAction={(action) => act(selected, action)}
            />
          ) : (
            <div className="hidden min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E4E7] px-6 text-center @4xl:flex">
              <Inbox size={22} className="text-[#A1A1AA]" aria-hidden />
              <p className="mt-3 text-sm font-medium text-[#3F3F46]">{t("pick.title")}</p>
              <p className="mt-1 max-w-sm text-xs text-[#71717A]">{t(`pick.${tab}`)}</p>
            </div>
          )}
        </div>
      </div>

      {dialog && selected && (
        <TicketActionDialog
          key={`${selected.id}-${dialog}`}
          ticket={selected}
          kind={dialog}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(action) => act(selected, action)}
        />
      )}
    </>
  );
}
