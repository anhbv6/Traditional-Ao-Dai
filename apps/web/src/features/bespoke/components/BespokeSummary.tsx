"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Clock, RotateCcw, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { ActionButton } from "@/components/shared/ActionButton";
import { type BespokeConfig } from "../constants/bespokeOptions";
import { type BespokeQuote } from "../utils/pricing";
import { AoDaiPreview } from "./AoDaiPreview";

interface BespokeSummaryProps {
  config: BespokeConfig;
  quote: BespokeQuote;
  locale: Locale;
  notes: string;
  onAddToCart: () => void;
  onReset: () => void;
}

/**
 * Cột tóm tắt thiết kế (cùng khung với tóm tắt Giỏ hàng / Thanh toán), chia 3 phần để ghim cao vừa màn hình:
 * - Đầu: tiêu đề.
 * - Giữa (tự cuộn): hình minh hoạ áo (đổi theo lựa chọn) + bảng thông số.
 * - Đáy (luôn thấy): bảng giá (giá may + phụ phí) → tạm tính (số "lăn" khi đổi) → thời gian → thêm vào giỏ.
 */
export function BespokeSummary({ config, quote, locale, notes, onAddToCart, onReset }: BespokeSummaryProps) {
  const t = useTranslations("BespokePage");
  const price = (value: number) => formatVnd(value, locale);

  const specs: { key: string; value: string }[] = [
    { key: "style", value: t(`options.style.${config.style}.label`) },
    { key: "fabric", value: t(`options.fabric.${config.fabric}.label`) },
    { key: "color", value: t(`options.color.${config.color}`) },
    { key: "collar", value: t(`options.collar.${config.collar}`) },
    { key: "sleeve", value: t(`options.sleeve.${config.sleeve}`) },
    { key: "length", value: t(`options.length.${config.length}`) },
    {
      key: "decoration",
      value:
        config.decoration === "embroidery"
          ? `${t("options.decoration.embroidery.label")} · ${t(`options.motif.${config.motif}`)}`
          : t(`options.decoration.${config.decoration}.label`),
    },
    { key: "pants", value: t(`options.pants.${config.pants}.label`) },
    {
      key: "measurements",
      value: config.measureMode === "standard" ? `${t("options.measureMode.standard.label")} ${config.size}` : t(`options.measureMode.${config.measureMode}.label`),
    },
  ];

  const priceRows = [
    { key: "base", value: quote.basePrice },
    { key: "fabric", value: quote.fabricSurcharge },
    { key: "decoration", value: quote.decorationSurcharge },
    { key: "pants", value: quote.pantsSurcharge },
    { key: "rush", value: quote.rushFee },
  ].filter((row) => row.key === "base" || row.value > 0);

  return (
    <div className="flex flex-col bg-[var(--bg-card)] ring-1 ring-[var(--border)] lg:h-full">
      <h2 className="m-0 shrink-0 px-5 pt-5 font-[family-name:var(--font-playfair)] text-lg font-semibold sm:px-6 sm:text-xl">{t("summary.title")}</h2>

      {/* Giữa: hình minh hoạ + thông số — cuộn riêng */}
      <div data-lenis-prevent className="scrollbar-brand px-5 pb-4 sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
        <div className="mt-4 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4">
          <div className="relative aspect-[5/9] bg-[var(--bg-secondary)]/70 p-2">
            <AoDaiPreview config={config} label={t("summary.previewLabel")} />
          </div>
          <dl className="space-y-2 self-center text-xs">
            {specs.map((spec) => (
              <div key={spec.key}>
                <dt className="text-[10px] uppercase tracking-[1.5px] text-[var(--text-light)]">{t(`summary.specs.${spec.key}`)}</dt>
                <dd className="mt-0.5 font-semibold leading-snug text-[var(--text-main)]">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {notes.trim() ? (
          <p className="mt-4 border-l-2 border-[var(--accent-color)] pl-3 text-xs italic leading-5 text-[var(--text-light)]">
            {t("summary.notes")}: {notes.trim()}
          </p>
        ) : null}
      </div>

      {/* Đáy: báo giá + thêm vào giỏ — luôn hiện */}
      <div className="shrink-0 border-t border-[var(--border)] px-5 pb-5 pt-4 sm:px-6">
        <dl className="space-y-1.5 text-[13px]">
          {priceRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <dt className="text-[var(--text-light)]">{t(`summary.price.${row.key}`)}</dt>
              <dd className="tabular-nums">{row.key === "base" ? price(row.value) : `+${price(row.value)}`}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex items-end justify-between gap-4 border-t border-[var(--border)] pt-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[2px]">{t("summary.price.total")}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--text-light)]">
              <Clock size={12} strokeWidth={1.6} />
              {t("summary.estimate", { min: quote.minDays, max: quote.maxDays })}
            </p>
          </div>
          {/* Tổng "lăn" lên khi đổi lựa chọn */}
          <span className="relative h-8 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={quote.total}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="block font-[family-name:var(--font-playfair)] text-2xl font-semibold tabular-nums text-[var(--primary-ink)]"
              >
                {price(quote.total)}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[var(--text-light)]">{t("summary.note")}</p>

        <ActionButton variant="confirm" size="lg" fullWidth icon={<ShoppingBag />} onClick={onAddToCart} className="mt-4">
          {t("actions.addToCart")}
        </ActionButton>
        <div className="mt-3 flex items-center justify-between gap-4">
          <Link
            href="/contact"
            className="border-b border-[var(--primary-color)]/30 pb-0.5 text-[11px] uppercase tracking-[1.2px] text-[var(--text-light)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
          >
            {t("actions.bookFitting")}
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] uppercase tracking-[1.2px] text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
          >
            <RotateCcw size={12} strokeWidth={1.6} />
            {t("actions.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
