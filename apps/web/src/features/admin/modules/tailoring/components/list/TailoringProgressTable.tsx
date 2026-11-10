"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { TAILORING_STAGES, type TailoringItem, type TailoringOrder, type TailoringStage } from "../../types/tailoring.types";
import { daysBetween, nextStage, stageIndex, toShopDayKey, type TailoringInsight } from "../../utils/tailoringInsight";
import { DueText, SignalText, StageTrack } from "../shared/TailoringParts";

/** Cùng một khuôn cột cho hàng tiêu đề và mọi dòng: đơn / 6 công đoạn / hẹn trả / thao tác */
const ROW_GRID = "@4xl:grid @4xl:grid-cols-[minmax(190px,1.3fr)_repeat(6,minmax(64px,1fr))_140px_136px] @4xl:items-center";

export interface ProgressRow {
  order: TailoringOrder;
  insight: TailoringInsight;
}

interface TailoringProgressTableProps {
  rows: ProgressRow[];
  stageCounts: Record<TailoringStage, number>;
  activeStage: TailoringStage | null;
  onStageChange: (stage: TailoringStage | null) => void;
  todayKey: string;
  pendingItemId: string | null;
  onAdvance: (item: TailoringItem) => void;
  empty: string;
}

/**
 * Bảng theo tiến trình: mỗi dòng một món may, 6 cột là 6 công đoạn — vạch tiến độ chạy ngang, chấm ở công đoạn hiện tại
 * kèm số ngày đã nằm ở đó. Nhìn dọc một cột là biết công đoạn ấy đang dồn bao nhiêu việc; tiêu đề cột kiêm bộ lọc.
 * Khung hẹp (theo bề rộng bảng — container query, vì cột phải của admin có thể chiếm chỗ): mỗi món một khối gọn với thanh tiến độ thu nhỏ.
 */
export function TailoringProgressTable({
  rows,
  stageCounts,
  activeStage,
  onStageChange,
  todayKey,
  pendingItemId,
  onAdvance,
  empty,
}: TailoringProgressTableProps) {
  const t = useTranslations("AdminPage.tailoring");
  const advanceButton = (item: TailoringItem, next: TailoringStage) => (
    <button
      type="button"
      disabled={pendingItemId === item.id}
      onClick={() => onAdvance(item)}
      className="-mr-2 inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2 text-xs font-medium text-[#3F3F46] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] disabled:cursor-wait disabled:opacity-50 @4xl:mr-0"
    >
      {t("advance", { stage: t(`stage.${next}`) })}
      <ArrowRight size={13} aria-hidden />
    </button>
  );
  const daysIn = (item: TailoringItem) => Math.max(0, daysBetween(toShopDayKey(new Date(item.stageSince)), todayKey));

  return (
    <section className={cn(ADMIN_CARD_CLASS, "@container px-3 py-2 sm:px-4")}>
      {/* Hàng tiêu đề (chỉ khung rộng) — bấm tên công đoạn để lọc */}
      <div className={cn("hidden min-h-14 border-b border-dashed border-[#E4E4E7] text-body font-semibold text-[#3F3F46]", ROW_GRID)}>
        <span className="px-2">{t("table.order")}</span>
        {TAILORING_STAGES.map((stage) => {
          const active = activeStage === stage;
          return (
            <button
              key={stage}
              type="button"
              aria-pressed={active}
              onClick={() => onStageChange(active ? null : stage)}
              className={cn(
                "flex h-full cursor-pointer flex-col items-center justify-center gap-0.5 px-1 py-2 text-center transition-colors",
                active ? "bg-[#F4F4F5] text-[#09090B]" : "text-[#71717A] hover:text-[#09090B]"
              )}
            >
              {/* Tên công đoạn được xuống dòng (cột hẹp), số món ngay dưới */}
              <span className="text-xs font-medium leading-tight">{t(`stage.${stage}`)}</span>
              <span className={cn("font-mono text-sm font-semibold tabular-nums", stageCounts[stage] === 0 ? "text-[#D4D4D8]" : "text-[#09090B]")}>
                {stageCounts[stage]}
              </span>
            </button>
          );
        })}
        <span className="px-3">{t("table.due")}</span>
        <span className="sr-only">{t("table.actions")}</span>
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-body text-[#71717A]">{empty}</p>
      ) : (
        <ul>
          {rows.map(({ order, insight }) => {
            const cancelled = order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";
            const href = `/admin/tailoring/${order.id}`;
            return (
              <li key={order.id} className="border-b border-dashed border-[#E4E4E7] last:border-b-0">
                {order.items.map((item, itemIndex) => {
                  const current = stageIndex(item.status);
                  const next = nextStage(item.status);
                  const first = itemIndex === 0;
                  return (
                      <div key={item.id} className={cn("py-4 @4xl:py-3", ROW_GRID, !first && "pt-0 @4xl:pt-0")}>
                        {/* Đơn + món */}
                        <div className="min-w-0 px-2">
                          {first && (
                            <div className="flex items-baseline justify-between gap-3 @4xl:block">
                              <p className="min-w-0 truncate">
                                <Link href={href} className="font-mono text-sm font-semibold text-[#09090B] hover:underline">
                                  {order.orderNumber}
                                </Link>
                                <span className="ml-2 text-sm text-[#3F3F46]">{order.customerName}</span>
                              </p>
                              <DueText insight={insight} dueDate={order.dueDate} className="shrink-0 text-xs @4xl:hidden" />
                            </div>
                          )}
                          <p className={cn("truncate text-xs text-[#71717A]", first && "mt-0.5")}>
                            {item.productName}
                            {item.quantity > 1 && ` × ${item.quantity}`}
                            {item.materialName && ` · ${item.materialName}`}
                          </p>
                          {first && <SignalText signals={insight.signals} className="mt-1" />}
                        </div>

                        {/* 6 ô công đoạn — vạch nối liền, chấm ở công đoạn hiện tại (khung rộng) */}
                        {TAILORING_STAGES.map((stage, index) => (
                          <div key={stage} className={cn("relative hidden h-12 @4xl:block", activeStage === stage && "bg-[#FAFAFA]")}>
                            {/* Nửa trái nối từ ô trước, nửa phải nối sang ô sau */}
                            {index > 0 && (
                              <span
                                aria-hidden
                                className={cn(
                                  "absolute left-0 top-1/2 h-0.5 w-1/2 -translate-y-1/2",
                                  index <= current ? (cancelled ? "bg-[#A1A1AA]" : "bg-[#18181B]") : "bg-[#E4E4E7]"
                                )}
                              />
                            )}
                            {index < TAILORING_STAGES.length - 1 && (
                              <span
                                aria-hidden
                                className={cn(
                                  "absolute right-0 top-1/2 h-0.5 w-1/2 -translate-y-1/2",
                                  index < current ? (cancelled ? "bg-[#A1A1AA]" : "bg-[#18181B]") : "bg-[#E4E4E7]"
                                )}
                              />
                            )}
                            {index === current ? (
                              <>
                                <span
                                  className={cn(
                                    "absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white",
                                    cancelled ? "bg-[#A1A1AA]" : stage === "COMPLETED" ? "bg-emerald-500" : "bg-[#18181B]"
                                  )}
                                >
                                  <span className="sr-only">{t(`stage.${stage}`)}</span>
                                </span>
                                {stage !== "COMPLETED" && (
                                  <span className="absolute left-1/2 top-[calc(50%+10px)] -translate-x-1/2 whitespace-nowrap font-mono text-2xs tabular-nums text-[#71717A]">
                                    {t("table.daysIn", { days: daysIn(item) })}
                                  </span>
                                )}
                              </>
                            ) : (
                              index < current && (
                                <span aria-hidden className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#18181B]" />
                              )
                            )}
                          </div>
                        ))}

                        {/* Khung hẹp: thanh tiến độ gọn + công đoạn hiện tại */}
                        <div className="mt-3 px-2 @4xl:hidden">
                          <StageTrack stage={item.status} muted={cancelled} />
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="text-xs text-[#3F3F46]">
                              {t(`stage.${item.status}`)}
                              {item.status !== "COMPLETED" && (
                                <span className="text-[#71717A]"> · {t("table.daysIn", { days: daysIn(item) })}</span>
                              )}
                            </p>
                            {next && !cancelled && advanceButton(item, next)}
                          </div>
                        </div>

                        {/* Hẹn trả (khung rộng) */}
                        <div className="hidden px-3 text-sm @4xl:block">
                          {first && <DueText insight={insight} dueDate={order.dueDate} className="whitespace-normal text-xs leading-snug" />}
                        </div>

                        {/* Thao tác: sang công đoạn kế (khung rộng — khung hẹp nằm cạnh tên công đoạn ở trên) */}
                        <div className="hidden justify-end px-2 @4xl:flex">{next && !cancelled && advanceButton(item, next)}</div>
                      </div>
                  );
                })}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
