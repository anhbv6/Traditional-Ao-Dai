"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, ADMIN_SECONDARY_BUTTON_CLASS, AdminFilterSelect, AdminListPanel } from "@/features/admin/core/ui";
import {
  STOCK_EVENT_DIRECTIONS,
  type StockEvent,
  type StockEventDirection,
  type StockEventSubject,
  type StockHistoryData,
  type StockUnit,
} from "../../types/inventoryHistory.types";
import { HISTORY_PERIODS, SHOP_TIME_ZONE, STOCK_EVENT_DIRECTION, type HistoryPeriod } from "../../utils/stockEventMeta";
import { StockEventRow, useSignedNumber, useUnitLabel } from "./StockEventRow";

const PAGE_SIZE = 60;
const DAY = 24 * 60 * 60 * 1000;

type PeriodValue = `${HistoryPeriod}`;

/**
 * Màn lịch sử biến động kho: nhật ký theo ngày (mỗi ngày một thẻ như trang sổ kho), lọc theo hàng hóa (SKU / vải),
 * loại biến động (nhập / xuất / hao hụt / kiểm kê) và khoảng thời gian; một dòng tóm tắt kỳ ở trên thay cho thẻ KPI.
 */
export function StockHistoryBoard({ data }: { data: StockHistoryData }) {
  const t = useTranslations("AdminPage.inventoryHistory");
  const tPage = useTranslations("AdminPage.pages.inventoryHistory");
  const format = useFormatter();
  const signed = useSignedNumber();
  const unitLabel = useUnitLabel();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<"ALL" | StockEventSubject>("ALL");
  const [direction, setDirection] = useState<"ALL" | StockEventDirection>("ALL");
  const [period, setPeriod] = useState<PeriodValue>("30");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Mốc đầu kỳ = 0h (giờ tiệm) của ngày đầu kỳ, tính từ "hôm nay" do server gửi — không dùng giờ máy khách khi render
  const periodStart = new Date(new Date(`${data.todayKey}T00:00:00+07:00`).getTime() - (Number(period) - 1) * DAY).toISOString();
  const keyword = search.trim().toLowerCase();

  const inScope = data.events.filter(
    (event) =>
      event.createdAt >= periodStart &&
      (subject === "ALL" || event.subject === subject) &&
      (!keyword ||
        [event.title, event.code, event.orderCode ?? "", event.note ?? "", event.actorName ?? "", ...event.lines.map((line) => `${line.code} ${line.detail ?? ""}`)]
          .some((value) => value.toLowerCase().includes(keyword)))
  );
  const visible = inScope.filter((event) => direction === "ALL" || STOCK_EVENT_DIRECTION[event.kind] === direction);
  const shown = visible.slice(0, limit);

  // Gom theo ngày (dayKey do server tính theo giờ tiệm)
  const days: { key: string; events: StockEvent[] }[] = [];
  for (const event of shown) {
    const last = days[days.length - 1];
    if (last?.key === event.dayKey) last.events.push(event);
    else days.push({ key: event.dayKey, events: [event] });
  }

  const dayLabel = (key: string) => {
    const date = format.dateTime(new Date(`${key}T12:00:00+07:00`), {
      weekday: "long",
      day: "numeric",
      month: "numeric",
      year: key.slice(0, 4) === data.todayKey.slice(0, 4) ? undefined : "numeric",
      timeZone: SHOP_TIME_ZONE,
    });
    if (key === data.todayKey) return t("today", { date });
    if (key === data.yesterdayKey) return t("yesterday", { date });
    return date;
  };

  // Tóm tắt kỳ: cộng theo hướng + đơn vị (kiểm kê không tính vì là đính chính, không phải hàng vào / ra)
  const summary = (["IN", "OUT", "LOSS"] as const).flatMap((dir) => {
    const parts = (["PIECE", "METER"] as StockUnit[]).flatMap((unit) => {
      const total = inScope
        .filter((event) => STOCK_EVENT_DIRECTION[event.kind] === dir && event.unit === unit)
        .reduce((sum, event) => sum + event.delta, 0);
      return total !== 0 ? [`${signed(Math.round(total * 100) / 100)} ${unitLabel(unit)}`] : [];
    });
    return parts.length > 0 ? [{ dir, text: parts.join(", ") }] : [];
  });

  const dayNet = (events: StockEvent[], unit: StockUnit) =>
    Math.round(events.filter((event) => event.unit === unit).reduce((sum, event) => sum + event.delta, 0) * 100) / 100;

  return (
    <>
      <AdminListPanel
        icon={History}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: (value) => { setSearch(value); setLimit(PAGE_SIZE); }, placeholder: t("searchPlaceholder") }}
        filters={
          <>
            <AdminFilterSelect
              label={t("filter.subject")}
              value={subject}
              onChange={(value) => {
                setSubject(value);
                setLimit(PAGE_SIZE);
              }}
              options={[
                { value: "ALL" as const, label: t("filter.all") },
                { value: "SKU" as const, label: t("subject.SKU") },
                { value: "FABRIC" as const, label: t("subject.FABRIC") },
              ]}
              className="w-full sm:w-48"
            />
            <AdminFilterSelect
              label={t("filter.direction")}
              value={direction}
              onChange={(value) => {
                setDirection(value);
                setLimit(PAGE_SIZE);
              }}
              options={[
                { value: "ALL" as const, label: t("filter.all") },
                ...STOCK_EVENT_DIRECTIONS.map((value) => ({ value, label: t(`direction.${value}`) })),
              ]}
              className="w-full sm:w-52"
            />
            <AdminFilterSelect
              label={t("filter.period")}
              value={period}
              onChange={(value) => {
                setPeriod(value);
                setLimit(PAGE_SIZE);
              }}
              options={HISTORY_PERIODS.map((days) => ({ value: `${days}` as PeriodValue, label: t("period", { days }) }))}
              className="w-full sm:w-48"
            />
          </>
        }
      />

      {/* Một dòng tóm tắt kỳ — không phải thẻ KPI */}
      <p className="text-xs leading-relaxed text-[#71717A]">
        <span>{t("summary.lead", { days: Number(period), count: visible.length })}</span>
        {summary.map((item) => (
          <span key={item.dir}>
            {" · "}
            {t(`summary.${item.dir}`)}{" "}
            <span className="font-mono tabular-nums text-[#09090B]">{item.text}</span>
          </span>
        ))}
      </p>

      {days.length === 0 ? (
        <p className={cn(ADMIN_CARD_CLASS, "py-20 text-center text-body text-[#71717A]")}>
          {data.events.length === 0 ? t("empty") : t("noResults")}
        </p>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <section key={day.key} className={cn(ADMIN_CARD_CLASS, "px-4 sm:px-5")}>
              <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-dashed border-[#E4E4E7] py-3">
                <h2 className="text-body font-semibold text-[#09090B] first-letter:uppercase">{dayLabel(day.key)}</h2>
                <p className="font-mono text-xs tabular-nums text-[#71717A]">
                  {(["PIECE", "METER"] as const)
                    .filter((unit) => day.events.some((event) => event.unit === unit))
                    .map((unit) => `${signed(dayNet(day.events, unit))} ${unitLabel(unit)}`)
                    .join(" · ")}
                </p>
              </header>
              <ul className="divide-y divide-dashed divide-[#E4E4E7]">
                {day.events.map((event) => (
                  <StockEventRow key={event.id} event={event} />
                ))}
              </ul>
            </section>
          ))}

          {visible.length > shown.length && (
            <div className="flex justify-center">
              <button type="button" onClick={() => setLimit((value) => value + PAGE_SIZE)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                {t("loadMore", { count: visible.length - shown.length })}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
