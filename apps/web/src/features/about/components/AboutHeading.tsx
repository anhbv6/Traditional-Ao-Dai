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
 * Tiêu đề khối của trang Câu chuyện theo phong cách Minimalism:
 * Nhãn chỉ mục thanh thoát (độ tương phản cao >= 4.5:1) → Tiêu đề kiến trúc serif → Đoạn mô tả thoáng, dễ đọc.
 */
export function AboutHeading({ eyebrow, title, description, className }: AboutHeadingProps) {
  return (
    <Reveal className={cn("mb-10 max-w-2xl sm:mb-12", className)}>
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-(--primary-ink)">
        <span aria-hidden="true" className="h-px w-6 bg-(--primary-ink)/35" />
        {eyebrow}
      </p>
      <h2 className="mt-3.5 font-[family-name:var(--font-playfair)] text-[1.75rem] font-semibold leading-[1.25] text-(--heading-color) sm:text-[2.25rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[15px] leading-relaxed text-(--text-main)/90 sm:text-base sm:leading-relaxed">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
