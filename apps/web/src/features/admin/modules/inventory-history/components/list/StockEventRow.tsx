"use client";

import { useState } from "react";
import { Shirt } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { type StockEvent, type StockUnit } from "../../types/inventoryHistory.types";
import { SHOP_TIME_ZONE, STOCK_EVENT_DIRECTION, STOCK_EVENT_ICONS } from "../../utils/stockEventMeta";

/** Số dòng SKU hiện sẵn — nhiều hơn thì gập lại */
const VISIBLE_LINES = 3;

/** Vân dệt mờ cho ô vải (cùng kiểu ô vải ở màn Số lượng vải) */
const WEAVE_OVERLAY =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.07) 0 1px, transparent 1px 4px)";

/** "+3" / "−2,2" / "±0" — dấu trừ thật (U+2212) để thẳng cột số */
export function useSignedNumber() {
  const format = useFormatter();
  return (value: number) =>
    `${value > 0 ? "+" : value < 0 ? "−" : "±"}${format.number(Math.abs(value), { maximumFractionDigits: 2 })}`;
}

export function useUnitLabel() {
  const t = useTranslations("AdminPage.inventoryHistory");
  return (unit: StockUnit) => t(`unit.${unit}`);
}

/**
 * Một dòng nhật ký: ảnh / ô vải kèm icon loại biến động, tên hàng + loại, từng SKU / cây vải trước → sau,
 * ghi chú, người làm · giờ · mã đơn; bên phải là tổng tăng / giảm.
 */
export function StockEventRow({ event }: { event: StockEvent }) {
  const t = useTranslations("AdminPage.inventoryHistory");
  const format = useFormatter();
  const signed = useSignedNumber();
  const unitLabel = useUnitLabel();
  const [expanded, setExpanded] = useState(false);
  const Icon = STOCK_EVENT_ICONS[event.kind];
  const direction = STOCK_EVENT_DIRECTION[event.kind];
  const lines = expanded ? event.lines : event.lines.slice(0, VISIBLE_LINES);
  const hidden = event.lines.length - lines.length;
  const fmt = (value: number) => format.number(value, { maximumFractionDigits: 2 });

  return (
    <li className="flex gap-3 py-4 sm:gap-4">
      {/* Ảnh sản phẩm / ô vải + icon loại biến động ở góc */}
      <div className="relative shrink-0 self-start">
        {event.subject === "FABRIC" ? (
          <span
            aria-hidden
            className="block size-10 rounded-lg border border-black/10"
            style={{ backgroundColor: event.hex ?? "#F4F4F5", backgroundImage: WEAVE_OVERLAY }}
          />
        ) : (
          <span className="grid aspect-[3/4] w-10 place-items-center overflow-hidden rounded-lg bg-[#F4F4F5] ring-1 ring-[#E4E4E7]/70">
            {event.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm do admin nhập (URL tùy ý), không qua next/image
              <img src={event.image} alt="" className="size-full object-contain" />
            ) : (
              <Shirt size={16} className="text-[#A1A1AA]" aria-hidden />
            )}
          </span>
        )}
        <span
          aria-hidden
          className={cn(
            "absolute -bottom-1.5 -right-1.5 grid size-5 place-items-center rounded-full ring-2 ring-white",
            direction === "IN" ? "bg-emerald-600 text-white" : direction === "LOSS" ? "bg-rose-600 text-white" : "bg-[#18181B] text-white"
          )}
        >
          <Icon size={11} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-body font-medium text-[#09090B]">
              {event.href ? (
                <Link href={event.href} className="hover:underline">
                  {event.title}
                </Link>
              ) : (
                event.title
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#71717A]">
              {t(`kind.${event.kind}`)}
              {event.code && (
                <>
                  {" · "}
                  <span className={cn(event.subject === "SKU" && "font-mono text-2xs")}>{event.code}</span>
                </>
              )}
            </p>
          </div>
          <p className="shrink-0 whitespace-nowrap text-right">
            <span
              className={cn(
                "font-mono text-body font-semibold tabular-nums",
                event.delta > 0 ? "text-emerald-700" : event.delta < 0 ? "text-[#09090B]" : "text-[#A1A1AA]"
              )}
            >
              {signed(event.delta)}
            </span>
            <span className="ml-1 text-xs text-[#71717A]">{unitLabel(event.unit)}</span>
          </p>
        </div>

        {/* Từng SKU / cây vải: trước → sau */}
        <ul className="mt-2 space-y-1">
          {lines.map((line) => (
            <li key={line.code} className="flex items-center gap-2 text-xs">
              {line.hex && event.subject === "SKU" && (
                <span aria-hidden className="size-2.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: line.hex }} />
              )}
              <span className="min-w-0 truncate text-[#3F3F46]">
                {line.detail && <span className="mr-1.5">{line.detail}</span>}
                <span className="font-mono text-2xs text-[#A1A1AA]">{line.code}</span>
              </span>
              <span className="ml-auto shrink-0 whitespace-nowrap font-mono tabular-nums text-[#71717A]">
                {line.from !== null && line.to !== null ? (
                  <>
                    {fmt(line.from)} → <span className="text-[#09090B]">{fmt(line.to)}</span>
                  </>
                ) : (
                  signed(line.delta)
                )}
              </span>
            </li>
          ))}
        </ul>
        {event.lines.length > VISIBLE_LINES && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-1 cursor-pointer text-xs text-[#71717A] underline-offset-2 hover:text-[#09090B] hover:underline"
          >
            {expanded ? t("collapse") : t("moreLines", { count: hidden })}
          </button>
        )}

        {event.note && <p className="mt-2 text-xs italic text-[#52525B]">“{event.note}”</p>}

        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#71717A]">
          <span>
            {event.actorName
              ? event.actorIsCustomer
                ? t("actor.customer", { name: event.actorName })
                : event.actorName
              : t("actor.unknown")}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={event.createdAt}>
            {format.dateTime(new Date(event.createdAt), { hour: "2-digit", minute: "2-digit", timeZone: SHOP_TIME_ZONE })}
          </time>
          {event.orderCode && (
            <>
              <span aria-hidden>·</span>
              <span className="font-mono text-2xs">{event.orderCode}</span>
            </>
          )}
          {event.orderCancelled && (
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-2xs font-medium text-amber-700">
              {t("orderCancelled")}
            </span>
          )}
        </p>
      </div>
    </li>
  );
}
