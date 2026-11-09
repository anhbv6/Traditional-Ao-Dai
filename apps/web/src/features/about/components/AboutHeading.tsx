"use client";

import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";

interface AboutHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Tiêu đề khối của trang Câu chuyện: nhãn nhỏ → tiêu đề → mô tả, xếp dọc một cột hẹp
 * để mắt đọc thẳng xuống, không phải nhảy qua lại giữa hai cột.
 */
export function AboutHeading({ eyebrow, title, description, className }: AboutHeadingProps) {
  return (
    <Reveal className={cn("mb-10 max-w-2xl sm:mb-12", className)}>
      <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)]">
        <span aria-hidden="true" className="h-px w-8 bg-[var(--accent-color)]" />
        {eyebrow}
      </p>
      <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-[1.75rem] font-semibold leading-tight text-[var(--text-main)] sm:text-[2.25rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[15px] leading-7 text-[var(--text-light)] sm:text-base sm:leading-8">{description}</p>
      ) : null}
    </Reveal>
  );
}
