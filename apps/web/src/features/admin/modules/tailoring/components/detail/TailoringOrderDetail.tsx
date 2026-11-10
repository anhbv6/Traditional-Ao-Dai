"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, Phone, Printer } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { AppMenu } from "@/components/shared/AppMenu";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
  AdminTextArea,
} from "@/features/admin/core/ui";
import { useMoveStage } from "../../hooks/useMoveStage";
import {
  TAILORING_MEASUREMENT_KEYS,
  TAILORING_STAGES,
  type TailoringItem,
  type TailoringOrderDetailData,
  type TailoringStage,
} from "../../types/tailoring.types";
import { applyMove } from "../../utils/applyMove";
import { SHOP_TIME_ZONE, STAGE_ICONS, isTailoringStage, nextStage, readTailoringOrder, stageIndex } from "../../utils/tailoringInsight";
import { DueText, SignalText, StageLabel, TailoringThumb } from "../shared/TailoringParts";

function Card({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-[#71717A]">{label}</span>
      <span className="min-w-0 text-right font-medium text-[#09090B]">{children}</span>
    </div>
  );
}

/**
 * Phiếu may một đơn: mỗi món một thẻ (dây công đoạn có nhãn, chuyển bước + ghi chú cho thợ, số đo, ghi chú vóc dáng),
 * nhật ký xưởng bên dưới; cột phải là hẹn & tín hiệu, thanh toán, khách. In được thành phiếu giấy cho bàn cắt.
 */
export function TailoringOrderDetail({ data }: { data: TailoringOrderDetailData }) {
  const t = useTranslations("AdminPage.tailoring");
  const tm = useTranslations("AdminPage.measurements");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const [order, setOrder] = useState(data);
  const [now, setNow] = useState(data.now);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const move = useMoveStage((result) => {
    setOrder((prev) => {
      const [moved] = applyMove([prev], result);
      return {
        ...moved,
        logs: [
          {
            id: result.logId,
            orderItemId: result.itemId,
            status: result.stage,
            note: result.note,
            images: [],
            staffName: result.staffName,
            createdAt: result.createdAt,
          },
          ...prev.logs,
        ],
      };
    });
    setNotes((prev) => ({ ...prev, [result.itemId]: "" }));
    setNow(result.createdAt);
  });

  const moveTo = (item: TailoringItem, stage: TailoringStage) => {
    setPendingItemId(item.id);
    move.mutate({ itemId: item.id, stage, note: notes[item.id] }, { onSettled: () => setPendingItemId(null) });
  };

  const insight = readTailoringOrder(order, order.todayKey);
  const cancelled = order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";
  const itemName = (id: string | null) => order.items.find((item) => item.id === id)?.productName ?? null;
  const time = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: SHOP_TIME_ZONE });

  return (
    <>
      <AdminDetailHeader
        backHref="/admin/tailoring"
        backLabel={t("detail.back")}
        title={order.orderNumber}
        badge={<DueText insight={insight} dueDate={order.dueDate} className="text-sm font-medium" />}
        subtitle={`${order.customerName} · ${t(`orderStatus.${order.orderStatus}`)}`}
        actions={
          <button type="button" onClick={() => window.print()} className={ADMIN_SECONDARY_BUTTON_CLASS}>
            <Printer size={15} aria-hidden /> {t("detail.print")}
          </button>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {order.items.map((item, index) => {
            const next = nextStage(item.status);
            const current = stageIndex(item.status);
            const measured = TAILORING_MEASUREMENT_KEYS.filter((key) => item.measurements[key] !== undefined);
            return (
              <Card
                key={item.id}
                title={order.items.length > 1 ? t("detail.itemTitle", { index: index + 1, name: item.productName }) : item.productName}
                aside={<StageLabel stage={item.status} className="text-sm text-[#3F3F46]" />}
              >
                <div className="flex gap-4">
                  <TailoringThumb image={item.image} className="w-16" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <InfoRow label={t("detail.material")}>{item.materialName ?? <span className="font-normal text-[#A1A1AA]">—</span>}</InfoRow>
                    {item.variantName && <InfoRow label={t("detail.variant")}>{item.variantName}</InfoRow>}
                    <InfoRow label={t("detail.quantity")}>{item.quantity}</InfoRow>
                    <InfoRow label={t("detail.leadTime")}>{t("detail.days", { count: item.leadTimeDays })}</InfoRow>
                  </div>
                </div>

                {/* Dây công đoạn có nhãn — biết rõ món đang ở đâu và còn mấy bước */}
                <ol className="mt-5 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6">
                  {TAILORING_STAGES.map((stage, stageIdx) => {
                    const Icon = STAGE_ICONS[stage];
                    const state = stageIdx < current ? "done" : stageIdx === current ? "current" : "todo";
                    return (
                      <li key={stage} className="min-w-0">
                        <span
                          className={cn(
                            "block h-1.5 rounded-full",
                            state === "done" ? "bg-[#18181B]" : state === "current" ? (stage === "COMPLETED" ? "bg-emerald-500" : "bg-[#18181B]/45") : "bg-[#E4E4E7]"
                          )}
                        />
                        <span
                          className={cn(
                            "mt-1.5 flex items-center gap-1 text-xs",
                            state === "current" ? "font-medium text-[#09090B]" : state === "done" ? "text-[#3F3F46]" : "text-[#A1A1AA]"
                          )}
                        >
                          <Icon size={12} aria-hidden className="shrink-0" />
                          <span className="truncate">{t(`stage.${stage}`)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>

                {!cancelled && (
                  <div className="mt-5 space-y-3 rounded-xl border border-dashed border-[#E4E4E7] p-3 print:hidden">
                    <AdminTextArea
                      label={t("detail.noteLabel")}
                      hint={t("detail.noteHint")}
                      rows={2}
                      value={notes[item.id] ?? ""}
                      onChange={(event) => setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      maxLength={500}
                      placeholder={t("detail.notePlaceholder")}
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <AppMenu
                        tone="admin"
                        width={232}
                        align="end"
                        sideOffset={4}
                        selection={{
                          value: item.status,
                          onValueChange: (value) => {
                            if (isTailoringStage(value) && value !== item.status) moveTo(item, value);
                          },
                        }}
                        items={TAILORING_STAGES.map((stage) => ({ key: stage, label: t(`stage.${stage}`), icon: STAGE_ICONS[stage] }))}
                        trigger={
                          <button type="button" disabled={pendingItemId === item.id} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                            {t("detail.otherStage")} <ChevronDown size={14} aria-hidden />
                          </button>
                        }
                      />
                      {next && (
                        <button
                          type="button"
                          disabled={pendingItemId === item.id}
                          onClick={() => moveTo(item, next)}
                          className={ADMIN_PRIMARY_BUTTON_CLASS}
                        >
                          {t("advance", { stage: t(`stage.${next}`) })} <ArrowRight size={14} aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <h3 className="mb-3 mt-6 text-body font-semibold text-[#09090B]">{t("detail.measurements")}</h3>
                {measured.length === 0 ? (
                  <p className="text-sm text-[#A1A1AA]">{t("detail.noMeasurements")}</p>
                ) : (
                  // Ô âm lề -1px để viền phải / dưới của hàng, cột cuối bị khung cắt — hàng cuối thiếu ô vẫn trắng
                  <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#E4E4E7] sm:grid-cols-3 lg:grid-cols-4">
                    {measured.map((key) => (
                      <div key={key} className="-mb-px -mr-px border-b border-r border-[#E4E4E7] px-3 py-2.5">
                        <dt className="text-xs text-[#71717A]">{tm(key)}</dt>
                        <dd className="mt-0.5 font-mono text-body font-semibold tabular-nums text-[#09090B]">
                          {format.number(item.measurements[key] ?? 0, { maximumFractionDigits: 1 })}
                          <span className="ml-1 font-sans text-xs font-normal text-[#71717A]">{key === "weight" ? "kg" : "cm"}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {item.customNote && (
                  <p className="mt-3 rounded-lg bg-[#FAFAFA] px-3 py-2 text-sm text-[#3F3F46]">
                    <span className="font-medium">{t("detail.bodyNote")} </span>
                    {item.customNote}
                  </p>
                )}
              </Card>
            );
          })}

          <Card title={t("detail.timeline")}>
            {order.logs.length === 0 ? (
              <p className="text-sm text-[#A1A1AA]">{t("detail.noLogs")}</p>
            ) : (
              <ol className="relative space-y-5 border-l border-dashed border-[#E4E4E7] pl-5">
                {order.logs.map((log) => {
                  const stage = isTailoringStage(log.status) ? log.status : null;
                  const Icon = stage ? STAGE_ICONS[stage] : STAGE_ICONS.WAITING_FABRIC;
                  return (
                    <li key={log.id} className="relative">
                      <span className="absolute -left-[31px] top-0 grid size-5 place-items-center rounded-full bg-white text-[#3F3F46] ring-1 ring-[#E4E4E7]">
                        <Icon size={11} aria-hidden />
                      </span>
                      <p className="text-sm font-medium text-[#09090B]">
                        {stage ? t(`stage.${stage}`) : log.status}
                        {order.items.length > 1 && itemName(log.orderItemId) && (
                          <span className="font-normal text-[#71717A]"> · {itemName(log.orderItemId)}</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-[#71717A]">
                        {log.staffName ?? t("unknownStaff")} · {time(log.createdAt)}
                      </p>
                      {log.note && <p className="mt-1.5 text-sm text-[#3F3F46]">{log.note}</p>}
                      {log.images.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {log.images.map((src) => (
                            // eslint-disable-next-line @next/next/no-img-element -- ảnh xưởng tải lên Cloudinary (URL tùy ý)
                            <img key={src} src={src} alt="" className="size-16 rounded-lg border border-[#E4E4E7] object-cover" />
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <Card title={t("detail.schedule")}>
            <div className="space-y-2.5">
              <InfoRow label={t("detail.dueDate")}>
                {order.dueDate
                  ? format.dateTime(new Date(order.dueDate), { weekday: "short", day: "numeric", month: "numeric", year: "numeric", timeZone: SHOP_TIME_ZONE })
                  : <span className="font-normal text-[#A1A1AA]">{t("due.none")}</span>}
              </InfoRow>
              <InfoRow label={t("detail.state")}>
                <DueText insight={insight} dueDate={order.dueDate} />
              </InfoRow>
              <InfoRow label={t("detail.workLeft")}>{t("detail.days", { count: insight.workLeft })}</InfoRow>
              <InfoRow label={t("detail.orderedAt")}>{format.relativeTime(new Date(order.createdAt), new Date(now))}</InfoRow>
            </div>
            {insight.signals.length > 0 && <SignalText signals={insight.signals} className="mt-4" />}
          </Card>

          <Card title={t("detail.payment")}>
            <div className="space-y-2.5">
              <InfoRow label={t("detail.total")}>{formatVnd(order.totalAmount, locale)}</InfoRow>
              <InfoRow label={t("detail.deposit")}>{formatVnd(order.depositAmount, locale)}</InfoRow>
              <InfoRow label={t("detail.paidAmount")}>{formatVnd(order.paidAmount, locale)}</InfoRow>
              <div className="border-t border-dashed border-[#E4E4E7] pt-2.5">
                <InfoRow label={t("detail.remaining")}>{formatVnd(Math.max(0, order.totalAmount - order.paidAmount), locale)}</InfoRow>
              </div>
            </div>
          </Card>

          <Card title={t("detail.customer")}>
            <div className="space-y-2.5">
              <InfoRow label={t("detail.name")}>{order.customerName}</InfoRow>
              <InfoRow label={t("detail.phone")}>
                <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-1 font-mono hover:underline">
                  <Phone size={12} aria-hidden /> {order.customerPhone}
                </a>
              </InfoRow>
              <InfoRow label={t("detail.email")}>
                <span className="break-all font-normal">{order.customerEmail}</span>
              </InfoRow>
              <InfoRow label={t("detail.address")}>
                <span className="font-normal">{order.shippingAddress}</span>
              </InfoRow>
              {order.readyMadeCount > 0 && <InfoRow label={t("detail.readyMadeLabel")}>{t("readyMade", { count: order.readyMadeCount })}</InfoRow>}
            </div>
            {order.note && <p className="mt-4 rounded-lg bg-[#FAFAFA] px-3 py-2 text-sm text-[#3F3F46]">{order.note}</p>}
          </Card>
        </aside>
      </div>
    </>
  );
}
