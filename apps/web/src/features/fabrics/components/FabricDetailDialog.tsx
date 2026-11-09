"use client";

import { useState, type ReactNode } from "react";
import { PlayCircle, Ruler, Scissors } from "lucide-react";
import { useTranslations } from "next-intl";
import { MATERIAL_METRICS, METRIC_LEVELS } from "@repo/shared/materials";
import { AppDialog } from "@/components/shared/AppDialog";
import { ActionLink } from "@/components/shared/ActionLink";
import { cn } from "@/lib/utils";
import { AVAILABILITY_DOT, CARE_ICONS, SEASON_ICONS } from "../constants/fabricMeta";
import type { FabricMaterial } from "../types/fabrics.types";
import { FabricCover } from "./FabricCover";

/** Sắc độ từng phần sợi trong thanh thành phần — token thương hiệu, đậm → nhạt */
const COMPOSITION_TONES = ["bg-(--primary-color)", "bg-(--accent-color)", "bg-(--sale-gold)", "bg-(--text-light)", "bg-(--border)"];

type Slide = { kind: "image"; src: string } | { kind: "video"; src: string } | { kind: "weave" };

function buildSlides(material: FabricMaterial): Slide[] {
  const slides: Slide[] = material.closeupImages.map((src) => ({ kind: "image", src }));
  if (material.videoUrl) slides.push({ kind: "video", src: material.videoUrl });
  return slides.length > 0 ? slides : [{ kind: "weave" }];
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[2.5px] text-(--text-light)">{children}</h3>;
}

/** Gallery: khung lớn + dải ảnh nhỏ (ảnh cận, video độ rủ) */
function FabricGallery({ material }: { material: FabricMaterial }) {
  const t = useTranslations("FabricsPage.detail");
  const slides = buildSlides(material);
  const [active, setActive] = useState(0);
  const current = slides[Math.min(active, slides.length - 1)];

  return (
    <div className="md:sticky md:top-0 md:self-start">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-(--bg-secondary)">
        {current.kind === "video" ? (
          <video src={current.src} controls playsInline className="absolute inset-0 size-full object-cover" aria-label={t("video")} />
        ) : (
          <FabricCover
            material={material}
            src={current.kind === "image" ? current.src : undefined}
            sizes="(min-width: 640px) 420px, 100vw"
            className="absolute inset-0"
          />
        )}
        {current.kind === "weave" ? (
          <span className="absolute bottom-3 left-3 bg-(--bg-card)/90 px-2.5 py-1 text-[11px] text-(--text-light)">{t("noPhoto")}</span>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2" role="tablist" aria-label={t("gallery")}>
          {slides.map((slide, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={slide.kind === "video" ? t("video") : t("photo", { index: index + 1 })}
              onClick={() => setActive(index)}
              className={cn(
                "relative aspect-square cursor-pointer overflow-hidden ring-1 transition-[box-shadow,opacity] duration-300",
                index === active ? "ring-2 ring-(--primary-color)" : "opacity-70 ring-(--border) hover:opacity-100",
              )}
            >
              {slide.kind === "video" ? (
                <span className="grid size-full place-items-center bg-(--bg-inverse) text-white">
                  <PlayCircle size={20} strokeWidth={1.5} />
                </span>
              ) : (
                <FabricCover material={material} src={slide.kind === "image" ? slide.src : undefined} sizes="80px" className="size-full" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Năm thanh đo 1–5: mỗi thanh là 5 vạch, vạch đã đạt tô đỏ đô */
function MetricScale({ material }: { material: FabricMaterial }) {
  const t = useTranslations("FabricsPage");
  const rated = MATERIAL_METRICS.filter((metric) => material.metrics[metric] !== null);
  if (rated.length === 0) return null;

  return (
    <section>
      <SectionLabel>{t("detail.feel")}</SectionLabel>
      <dl className="space-y-2.5">
        {rated.map((metric) => {
          const value = material.metrics[metric] ?? 0;
          return (
            <div key={metric} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
              <dt className="text-[13px] text-(--text-main)">{t(`metric.${metric}`)}</dt>
              <dd className="flex items-center gap-3">
                <span className="flex flex-1 gap-1" aria-hidden="true">
                  {METRIC_LEVELS.map((level) => (
                    <span key={level} className={cn("h-1.5 flex-1", level <= value ? "bg-(--primary-color)" : "bg-(--bg-secondary)")} />
                  ))}
                </span>
                <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-(--text-light)">{t("detail.level", { value })}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

interface FabricDetailDialogProps {
  material: FabricMaterial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gọi sau khi hiệu ứng đóng xong — nơi an toàn bỏ chọn tấm vải */
  onClosed?: () => void;
}

/** Trang album mở to: gallery bên trái, "lý lịch" tấm vải bên phải */
export function FabricDetailDialog({ material, open, onOpenChange, onClosed }: FabricDetailDialogProps) {
  const t = useTranslations("FabricsPage");
  if (!material) return null;

  const composition = [...material.composition].sort((a, b) => b.percent - a.percent);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={onClosed}
      size="xl"
      icon={null}
      eyebrow={[material.code, material.origin].filter(Boolean).join(" · ")}
      title={material.name}
      description={material.description ?? undefined}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionLink href="/contact" variant="cancel">
            {t("detail.askSample")}
          </ActionLink>
          <ActionLink href="/custom" variant="confirm" icon={<Scissors size={16} strokeWidth={1.6} />}>
            {t("detail.tailor")}
          </ActionLink>
        </div>
      }
    >
      {/* key theo mã → đổi tấm vải thì gallery về ảnh đầu */}
      <div key={material.code} className="grid gap-8 pt-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <FabricGallery material={material} />

        <div className="space-y-7">
          <section>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className={cn("size-2 rotate-45", AVAILABILITY_DOT[material.availability])} />
                <span className="font-semibold text-(--text-main)">{t(`availability.${material.availability}`)}</span>
              </span>
              {material.widthCm ? (
                <span className="inline-flex items-center gap-2 text-(--text-light)">
                  <Ruler size={14} strokeWidth={1.6} />
                  {t("detail.width", { cm: material.widthCm })}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-[13px] leading-6 text-(--text-light)">{t(`availabilityHint.${material.availability}`)}</p>
          </section>

          {material.colors.length > 0 ? (
            <section>
              <SectionLabel>{t("detail.colors")}</SectionLabel>
              <ul className="flex flex-wrap gap-2">
                {material.colors.map((color) => (
                  <li key={color} className="border border-(--border) px-3 py-1 text-[13px] text-(--text-main)">
                    {color}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {composition.length > 0 ? (
            <section>
              <SectionLabel>{t("detail.composition")}</SectionLabel>
              <div className="flex h-2 w-full overflow-hidden" aria-hidden="true">
                {composition.map((item, index) => (
                  <span key={item.fiber} className={COMPOSITION_TONES[index % COMPOSITION_TONES.length]} style={{ width: `${item.percent}%` }} />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
                {composition.map((item, index) => (
                  <li key={item.fiber} className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className={cn("size-2", COMPOSITION_TONES[index % COMPOSITION_TONES.length])} />
                    <span className="text-(--text-main)">{t(`fiber.${item.fiber}`)}</span>
                    <span className="tabular-nums text-(--text-light)">{item.percent}%</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <MetricScale material={material} />

          {material.seasons.length > 0 ? (
            <section>
              <SectionLabel>{t("detail.seasons")}</SectionLabel>
              <ul className="flex flex-wrap gap-2">
                {material.seasons.map((season) => {
                  const Icon = SEASON_ICONS[season];
                  return (
                    <li key={season} className="inline-flex items-center gap-2 bg-(--bg-secondary) px-3 py-1.5 text-[13px] text-(--text-main)">
                      <Icon size={14} strokeWidth={1.6} className="text-(--primary-ink)" />
                      {t(`season.${season}`)}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {material.careCodes.length > 0 || material.careNote ? (
            <section>
              <SectionLabel>{t("detail.care")}</SectionLabel>
              <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                {material.careCodes.map((code) => {
                  const Icon = CARE_ICONS[code];
                  return (
                    <li key={code} className="inline-flex items-center gap-2.5 text-[13px] text-(--text-main)">
                      <span className="grid size-7 shrink-0 place-items-center border border-(--border) text-(--primary-ink)">
                        <Icon size={14} strokeWidth={1.6} />
                      </span>
                      {t(`care.${code}`)}
                    </li>
                  );
                })}
              </ul>
              {material.careNote ? <p className="mt-3 text-[13px] italic leading-6 text-(--text-light)">{material.careNote}</p> : null}
            </section>
          ) : null}

          {material.processSteps.length > 0 ? (
            <section>
              <SectionLabel>{t("detail.process")}</SectionLabel>
              <ol className="relative space-y-4 border-l border-(--border) pl-5">
                {material.processSteps.map((step, index) => (
                  <li key={index} className="relative">
                    <span aria-hidden="true" className="absolute -left-[1.6rem] top-1.5 size-2 rotate-45 border border-(--primary-color) bg-(--bg-card)" />
                    <p className="font-[family-name:var(--font-playfair)] text-[15px] font-semibold text-(--primary-ink)">{step.title}</p>
                    {step.detail ? <p className="mt-0.5 text-[13px] leading-6 text-(--text-light)">{step.detail}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>
    </AppDialog>
  );
}
