"use client";

import { useState, type DragEvent } from "react";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd } from "@repo/shared";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { PIPELINE_STAGES, type PipelineCard, type PipelineStage } from "../types/dashboard.types";

interface DashboardPipelineBoardProps {
  cards: PipelineCard[];
  isLoading?: boolean;
  /** Người dùng có được chuyển đơn VÀO cột này không */
  canMoveTo: (stage: PipelineStage) => boolean;
  onMove: (orderId: string, stage: PipelineStage) => void;
}

const DRAG_TYPE = "application/x-order-id";

/** Hạn trả: đỏ khi còn ≤ 1 ngày / đã trễ, vàng khi còn ≤ 3 ngày */
function DueChip({ days }: { days: number | null }) {
  const t = useTranslations("AdminPage.dashboard.pipeline");
  if (days === null) return <span className="text-[11px] text-[#A1A1AA]">{t("noDue")}</span>;

  const label = days < 0 ? t("overdue", { days: -days }) : days === 0 ? t("dueToday") : t("dueInDays", { days });
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        days <= 1 ? "bg-rose-50 text-rose-700" : days <= 3 ? "bg-amber-50 text-amber-700" : "bg-[#F4F4F5] text-[#71717A]"
      )}
    >
      {label}
    </span>
  );
}

function OrderCard({
  card,
  canMoveTo,
  onMove,
}: {
  card: PipelineCard;
  canMoveTo: DashboardPipelineBoardProps["canMoveTo"];
  onMove: DashboardPipelineBoardProps["onMove"];
}) {
  const t = useTranslations("AdminPage.dashboard.pipeline");
  const index = PIPELINE_STAGES.indexOf(card.stage);
  const prev = PIPELINE_STAGES[index - 1];
  const next = PIPELINE_STAGES[index + 1];
  const debt = Math.max(0, card.totalAmount - card.paidAmount);
  const paidRatio = card.totalAmount > 0 ? Math.min(100, (card.paidAmount / card.totalAmount) * 100) : 0;
  const draggable = PIPELINE_STAGES.some((stage) => stage !== card.stage && canMoveTo(stage));

  return (
    <article
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, card.orderId);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group rounded-lg border border-[#E4E4E7] bg-white p-3 shadow-2xs transition-shadow hover:shadow-sm",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#09090B]">{card.customerName}</p>
          <p className="font-mono text-[11px] text-[#71717A]">{card.orderNumber}</p>
        </div>
        {draggable ? <GripVertical size={14} className="mt-0.5 shrink-0 text-[#D4D4D8] group-hover:text-[#A1A1AA]" /> : null}
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-[#3F3F46]">{card.productNames.join(", ")}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <DueChip days={card.daysLeft} />
        {card.stage === "sewing" && ["FABRIC_CUTTING", "SEWING", "EMBROIDERY_BEADING"].includes(card.tailoringStatus) ? (
          <span className="rounded-md border border-[#E4E4E7] px-1.5 py-0.5 text-[11px] text-[#3F3F46]">
            {t(`tailoringStatus.${card.tailoringStatus}`)}
          </span>
        ) : null}
      </div>

      {/* Tiến độ thu tiền: cọc / tổng — còn nợ thì tô amber */}
      <div className="mt-3">
        <div className="h-1 overflow-hidden rounded-full bg-[#F4F4F5]">
          <div className={cn("h-full", debt > 0 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${paidRatio}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-[#71717A]">
          {debt > 0 ? t("debt", { amount: formatVnd(debt) }) : t("paidInFull")}
        </p>
      </div>

      <div className="mt-2 flex justify-between gap-1">
        {prev && canMoveTo(prev) ? (
          <button
            type="button"
            onClick={() => onMove(card.orderId, prev)}
            aria-label={t("movePrev", { stage: t(`stages.${prev}.title`) })}
            title={t("movePrev", { stage: t(`stages.${prev}.title`) })}
            className="grid size-7 cursor-pointer place-items-center rounded-md text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
          >
            <ChevronLeft size={15} />
          </button>
        ) : (
          <span />
        )}
        {next && canMoveTo(next) ? (
          <button
            type="button"
            onClick={() => onMove(card.orderId, next)}
            className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-[#18181B] px-2 text-[11px] font-medium text-white transition-colors hover:bg-[#09090B]"
          >
            {t(`stages.${next}.short`)}
            <ChevronRight size={13} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

/**
 * B. Bảng điều phối tiến độ may: 5 cột theo công đoạn, kéo thả thẻ hoặc bấm nút để chuyển cột
 */
export function DashboardPipelineBoard({ cards, isLoading, canMoveTo, onMove }: DashboardPipelineBoardProps) {
  const t = useTranslations("AdminPage.dashboard.pipeline");
  const [dropTarget, setDropTarget] = useState<PipelineStage | null>(null);

  const handleDrop = (event: DragEvent, stage: PipelineStage) => {
    event.preventDefault();
    setDropTarget(null);
    const orderId = event.dataTransfer.getData(DRAG_TYPE);
    const card = cards.find((c) => c.orderId === orderId);
    if (card && card.stage !== stage && canMoveTo(stage)) onMove(orderId, stage);
  };

  return (
    <section className={cn(ADMIN_CARD_CLASS, "overflow-hidden")}>
      <header className="border-b border-[#E4E4E7] px-5 py-4">
        <h2 className="text-sm font-semibold text-[#09090B]">{t("title")}</h2>
        <p className="mt-0.5 text-xs text-[#71717A]">{t("subtitle")}</p>
      </header>

      <div className="flex gap-3 overflow-x-auto bg-[#FAFAFA] p-3 [scrollbar-width:thin]">
        {PIPELINE_STAGES.map((stage, index) => {
          const columnCards = cards.filter((c) => c.stage === stage);
          const accepting = canMoveTo(stage);
          return (
            <div
              key={stage}
              onDragOver={(event) => {
                if (!accepting || !event.dataTransfer.types.includes(DRAG_TYPE)) return;
                event.preventDefault();
                setDropTarget(stage);
              }}
              onDragLeave={() => setDropTarget((current) => (current === stage ? null : current))}
              onDrop={(event) => handleDrop(event, stage)}
              className={cn(
                "flex w-[260px] shrink-0 flex-col rounded-lg border border-transparent p-1 transition-colors xl:w-auto xl:min-w-0 xl:flex-1",
                dropTarget === stage && "border-dashed border-[#A1A1AA] bg-white"
              )}
            >
              <div className="px-1.5 pb-2.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-xs font-semibold text-[#09090B]">
                    <span className="mr-1.5 font-mono text-[#A1A1AA]">{index + 1}</span>
                    {t(`stages.${stage}.title`)}
                  </h3>
                  <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#3F3F46] shadow-2xs">
                    {isLoading ? "–" : columnCards.length}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-[#71717A]">{t(`stages.${stage}.hint`)}</p>
              </div>

              <div className="flex max-h-[520px] flex-1 flex-col gap-2 overflow-y-auto px-0.5 pb-1">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-[#F4F4F5]" />)
                ) : columnCards.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#E4E4E7] py-6 text-center text-[11px] text-[#A1A1AA]">
                    {t("empty")}
                  </p>
                ) : (
                  columnCards.map((card) => <OrderCard key={card.orderId} card={card} canMoveTo={canMoveTo} onMove={onMove} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
