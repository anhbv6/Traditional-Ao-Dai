"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Cặp nút Trước / Sau dùng chung cho mọi slider, carousel (bản tin, đánh giá...).
 * Kiểu dáng: ô vuông 40px, viền đỏ đô mờ, mũi tên đỏ đô; rê chuột thì nền đỏ đô, mũi tên trắng.
 *
 * @example
 * <SliderNav onPrev={() => emblaApi?.scrollPrev()} onNext={() => emblaApi?.scrollNext()} />
 * <SliderNav onPrev={prev} onNext={next} prevDisabled={!canPrev} nextDisabled={!canNext} />
 */
interface SliderNavProps {
  onPrev: () => void;
  onNext: () => void;
  /** Nhãn cho trình đọc màn hình — mặc định "Trước" / "Sau" (namespace Common) */
  prevLabel?: string;
  nextLabel?: string;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  className?: string;
}

const BUTTON_CLASS =
  "flex size-10 cursor-pointer items-center justify-center border border-[var(--primary-color)]/30 text-[var(--primary-ink)] transition-colors " +
  "hover:bg-[var(--primary-color)] hover:text-white " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]/40 " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--primary-ink)]";

export function SliderNav({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  prevDisabled,
  nextDisabled,
  className,
}: SliderNavProps) {
  const t = useTranslations("Common");

  return (
    <div className={cn("flex gap-2", className)}>
      <button type="button" onClick={onPrev} disabled={prevDisabled} aria-label={prevLabel ?? t("previous")} className={BUTTON_CLASS}>
        <ChevronLeft size={16} strokeWidth={1.5} />
      </button>
      <button type="button" onClick={onNext} disabled={nextDisabled} aria-label={nextLabel ?? t("next")} className={BUTTON_CLASS}>
        <ChevronRight size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
