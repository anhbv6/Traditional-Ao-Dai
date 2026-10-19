"use client";

import React from "react";
import { MotionConfig, motion, AnimatePresence } from "motion/react";
import { ArrowRight, CalendarCheck, Info } from "lucide-react";
import { formatVnd } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { ActionButton } from "@/components/shared/ActionButton";
import { BackButton } from "@/components/shared/BackButton";
import { ChoiceGroup } from "@/components/shared/ChoiceGroup";
import { StepPanel } from "@/components/shared/StepPanel";
import { TextAreaField } from "@/components/shared/TextAreaField";
import { TextField } from "@/components/shared/TextField";
import { useNotify } from "@/hooks/useNotify";
import {
  COLLARS,
  COLORS,
  DECORATIONS,
  FABRICS,
  LENGTHS,
  MEASURE_MODES,
  MEASUREMENT_FIELDS,
  MOTIFS,
  OCCASIONS,
  PANTS,
  RUSH_DAYS,
  SLEEVES,
  STANDARD_SIZES,
  STYLES,
  TIMELINES,
} from "../data/bespokeOptions";
import { quoteBespoke } from "../utils/pricing";
import { MEASUREMENTS_SECTION_ID, useBespoke } from "../hooks/useBespoke";
import { BESPOKE_NOTES_MAX_LENGTH } from "../validations/bespoke.validation";
import { BespokeSummary } from "./BespokeSummary";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Màn May áo dài theo yêu cầu — cùng bố cục Thanh toán (tràn màn, 2 cột ngay từ đầu trang):
 * - Trái: tiêu đề → 9 phần đánh số (StepPanel): dịp mặc → kiểu dáng → chất liệu → màu → cổ / tay / tà →
 *   trang trí → quần → số đo → thời gian & ghi chú. Mọi lựa chọn dùng ChoiceGroup chung (radio thật, bàn phím được).
 * - Phải (desktop): hình minh hoạ áo đổi theo lựa chọn + thông số + báo giá, ghim cao vừa màn hình.
 * - Mobile: tóm tắt nằm cuối + thanh tạm tính & nút thêm vào giỏ cố định ở đáy.
 */
export function BespokeExperience() {
  const { t, locale, config, setOption, selectOccasion, notes, setNotes, measurementsForm, quote, addToCart, reset } = useBespoke();
  const notify = useNotify();
  const {
    register,
    formState: { errors, submitCount },
  } = measurementsForm;

  const price = (value: number) => formatVnd(value, locale);
  const surcharge = (value: number) => (value > 0 ? `+${price(value)}` : undefined);
  const decorationDays = (days: number) => (days > 0 ? ` · ${t("labels.extraDays", { days })}` : "");
  // Thời gian may tiêu chuẩn (để hiện ở lựa chọn "Tiêu chuẩn" kể cả khi đang chọn may gấp)
  const standardQuote = quoteBespoke({ ...config, timeline: "standard" });

  const summary = <BespokeSummary config={config} quote={quote} locale={locale} notes={notes} onAddToCart={addToCart} onReset={reset} />;

  return (
    <MotionConfig reducedMotion="user">
      <div className="pb-20 font-[family-name:var(--font-lora)] text-[var(--text-main)] lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:pb-0 xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-12">
        <div className="min-w-0">
          {/* Tiêu đề: mũi tên về Cửa hàng + eyebrow → tiêu đề + mô tả */}
          <header className="mb-8 sm:mb-10">
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE }} className="flex items-center gap-2">
              <BackButton href="/products" variant="inline" label={t("backToShop")} />
              <p className="text-[10px] uppercase tracking-[3px] text-[var(--text-light)] sm:text-[11px]">{t("eyebrow")}</p>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
              className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl"
            >
              {t("title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
              className="mt-1.5 max-w-2xl text-[13px] leading-6 text-[var(--text-light)]"
            >
              {t("subtitle")}
            </motion.p>
          </header>

          <div className="space-y-6">
            {/* 01 — Dịp mặc */}
            <StepPanel index={1} title={t("sections.occasion.title")} description={t("sections.occasion.description")}>
              <ChoiceGroup
                label={t("sections.occasion.title")}
                columns={3}
                value={config.occasion}
                onChange={selectOccasion}
                options={OCCASIONS.map((id) => ({
                  value: id,
                  label: t(`options.occasion.${id}.label`),
                  description: t(`options.occasion.${id}.description`),
                }))}
              />
            </StepPanel>

            {/* 02 — Kiểu dáng */}
            <StepPanel index={2} title={t("sections.style.title")} description={t("sections.style.description")}>
              <ChoiceGroup
                label={t("sections.style.title")}
                columns={2}
                value={config.style}
                onChange={(value) => setOption("style", value)}
                options={STYLES.map((style) => ({
                  value: style.id,
                  label: t(`options.style.${style.id}.label`),
                  description: t(`options.style.${style.id}.description`),
                  meta: price(style.basePrice),
                }))}
              />
            </StepPanel>

            {/* 03 — Chất liệu */}
            <StepPanel index={3} title={t("sections.fabric.title")} description={t("sections.fabric.description")}>
              <ChoiceGroup
                label={t("sections.fabric.title")}
                columns={2}
                value={config.fabric}
                onChange={(value) => setOption("fabric", value)}
                options={FABRICS.map((fabric) => ({
                  value: fabric.id,
                  label: t(`options.fabric.${fabric.id}.label`),
                  description: t(`options.fabric.${fabric.id}.description`),
                  meta: surcharge(fabric.surcharge),
                }))}
              />
            </StepPanel>

            {/* 04 — Màu vải */}
            <StepPanel index={4} title={t("sections.color.title")} description={t("sections.color.description")}>
              <ChoiceGroup
                label={t("sections.color.title")}
                variant="chip"
                value={config.color}
                onChange={(value) => setOption("color", value)}
                options={COLORS.map((color) => ({
                  value: color.id,
                  label: t(`options.color.${color.id}`),
                  leading: <span aria-hidden="true" className="size-4 shrink-0 rounded-full ring-1 ring-black/15" style={{ backgroundColor: color.hex }} />,
                }))}
              />
            </StepPanel>

            {/* 05 — Cổ, tay & độ dài tà */}
            <StepPanel index={5} title={t("sections.details.title")} description={t("sections.details.description")}>
              <div className="space-y-7">
                <ChoiceGroup
                  label={t("labels.collar")}
                  hideLabel={false}
                  variant="chip"
                  value={config.collar}
                  onChange={(value) => setOption("collar", value)}
                  options={COLLARS.map((id) => ({ value: id, label: t(`options.collar.${id}`) }))}
                />
                <ChoiceGroup
                  label={t("labels.sleeve")}
                  hideLabel={false}
                  variant="chip"
                  value={config.sleeve}
                  onChange={(value) => setOption("sleeve", value)}
                  options={SLEEVES.map((id) => ({ value: id, label: t(`options.sleeve.${id}`) }))}
                />
                <ChoiceGroup
                  label={t("labels.length")}
                  hideLabel={false}
                  variant="chip"
                  value={config.length}
                  onChange={(value) => setOption("length", value)}
                  options={LENGTHS.map((id) => ({ value: id, label: t(`options.length.${id}`) }))}
                />
              </div>
            </StepPanel>

            {/* 06 — Hoạ tiết & trang trí */}
            <StepPanel index={6} title={t("sections.decoration.title")} description={t("sections.decoration.description")}>
              <ChoiceGroup
                label={t("sections.decoration.title")}
                columns={2}
                value={config.decoration}
                onChange={(value) => setOption("decoration", value)}
                options={DECORATIONS.map((decoration) => ({
                  value: decoration.id,
                  label: t(`options.decoration.${decoration.id}.label`),
                  description: t(`options.decoration.${decoration.id}.description`),
                  meta: decoration.surcharge > 0 ? `${surcharge(decoration.surcharge)}${decorationDays(decoration.extraDays)}` : undefined,
                }))}
              />
              <AnimatePresence initial={false}>
                {config.decoration === "embroidery" ? (
                  <motion.div
                    key="motif"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <ChoiceGroup
                      className="pt-6"
                      label={t("labels.motif")}
                      hideLabel={false}
                      variant="chip"
                      value={config.motif}
                      onChange={(value) => setOption("motif", value)}
                      options={MOTIFS.map((id) => ({ value: id, label: t(`options.motif.${id}`) }))}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </StepPanel>

            {/* 07 — Quần / chân váy */}
            <StepPanel index={7} title={t("sections.pants.title")} description={t("sections.pants.description")}>
              <ChoiceGroup
                label={t("sections.pants.title")}
                columns={2}
                value={config.pants}
                onChange={(value) => setOption("pants", value)}
                options={PANTS.map((pants) => ({
                  value: pants.id,
                  label: t(`options.pants.${pants.id}.label`),
                  description: t(`options.pants.${pants.id}.description`),
                  meta: surcharge(pants.surcharge),
                }))}
              />
            </StepPanel>

            {/* 08 — Số đo */}
            <StepPanel id={MEASUREMENTS_SECTION_ID} index={8} title={t("sections.measurements.title")} description={t("sections.measurements.description")}>
              <ChoiceGroup
                label={t("sections.measurements.title")}
                columns={3}
                value={config.measureMode}
                onChange={(value) => setOption("measureMode", value)}
                options={MEASURE_MODES.map((id) => ({
                  value: id,
                  label: t(`options.measureMode.${id}.label`),
                  description: t(`options.measureMode.${id}.description`),
                }))}
              />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={config.measureMode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="mt-7"
                >
                  {config.measureMode === "standard" ? (
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <ChoiceGroup
                        label={t("labels.size")}
                        hideLabel={false}
                        variant="chip"
                        value={config.size}
                        onChange={(value) => setOption("size", value)}
                        options={STANDARD_SIZES.map((size) => ({ value: size, label: size }))}
                      />
                      <Link
                        href="/faqs"
                        className="border-b border-[var(--primary-color)]/30 pb-0.5 text-[11px] uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
                      >
                        {t("labels.sizeGuide")}
                      </Link>
                    </div>
                  ) : null}

                  {config.measureMode === "custom" ? (
                    <div>
                      <p className="mb-6 flex gap-2 text-xs leading-5 text-[var(--text-light)]">
                        <Info size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[var(--primary-ink)]" />
                        {t("labels.measureHint")}
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4">
                        {MEASUREMENT_FIELDS.map((field) => (
                          <TextField
                            key={field.id}
                            required
                            inputMode="decimal"
                            label={t(`options.measurement.${field.id}`)}
                            placeholder={`${field.min}–${field.max}`}
                            suffix={t("labels.unit")}
                            error={errors[field.id] ? notify.translateError(errors[field.id]?.message) : undefined}
                            shakeKey={submitCount}
                            {...register(field.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {config.measureMode === "studio" ? (
                    <p className="flex gap-2.5 border-l-2 border-[var(--accent-color)] bg-[var(--bg-secondary)]/70 px-4 py-3 text-xs leading-5 text-[var(--text-light)]">
                      <CalendarCheck size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--primary-ink)]" />
                      {t("labels.studioNote")}
                    </p>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </StepPanel>

            {/* 09 — Thời gian & ghi chú */}
            <StepPanel index={9} title={t("sections.timeline.title")} description={t("sections.timeline.description")}>
              <ChoiceGroup
                label={t("sections.timeline.title")}
                columns={2}
                value={config.timeline}
                onChange={(value) => setOption("timeline", value)}
                options={TIMELINES.map((id) => ({
                  value: id,
                  label: t(`options.timeline.${id}.label`),
                  description:
                    id === "rush"
                      ? t("options.timeline.rush.description", { days: RUSH_DAYS })
                      : t("options.timeline.standard.description", { min: standardQuote.minDays, max: standardQuote.maxDays }),
                }))}
              />
              <TextAreaField
                className="mt-8"
                label={t("labels.notes")}
                placeholder={t("labels.notesPlaceholder")}
                rows={3}
                maxLength={BESPOKE_NOTES_MAX_LENGTH}
                showCount
                value={notes}
                onValueChange={setNotes}
              />
            </StepPanel>
          </div>

          {/* Mobile / tablet: tóm tắt ở cuối */}
          <div className="mt-10 lg:hidden">{summary}</div>
        </div>

        {/* Cột phải (desktop): tóm tắt ghim đúng vị trí ban đầu, cao vừa màn hình */}
        <div className="hidden lg:block">
          <div className="sticky top-[calc(var(--site-header-h)+var(--page-y))] h-[calc(100svh-var(--site-header-h)-var(--page-y)-1rem)]">
            {summary}
          </div>
        </div>

        {/* Thanh tạm tính + thêm vào giỏ cố định đáy màn hình (mobile / tablet) */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--bg-card)]/95 px-(--page-gutter) py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[2px] text-[var(--text-light)]">{t("summary.price.total")}</p>
              <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold tabular-nums text-[var(--primary-ink)]">{price(quote.total)}</p>
            </div>
            <ActionButton variant="confirm" size="md" icon={<ArrowRight />} iconPosition="end" onClick={addToCart} className="shrink-0">
              {t("actions.addToCart")}
            </ActionButton>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
