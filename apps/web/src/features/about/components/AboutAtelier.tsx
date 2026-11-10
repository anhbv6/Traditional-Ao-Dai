"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/shared/Reveal";
import { ClipReveal } from "./ClipReveal";
import { AboutHeading } from "./AboutHeading";
import { atelierStories } from "../constants/aboutContent";
import { containerClassName } from "@/components/layout/Container";

const METRIC_KEYS = ["checks", "years", "consulting"] as const;

/**
 * Khối Nghệ nhân & Xưởng may (Minimalism Style):
 * - Bố cục lưới 3 cột cân xứng tuyệt đối (Swiss Grid), căn đồng đều chân đế và tiêu đề.
 * - Ảnh chụp chân dung nghệ nhân sắc nét, tự nhiên, không áp bộ lọc màu xám giả tạo.
 * - Vai trò & lời tâm huyết đạt độ tương phản chuẩn mực (>= 11:1), thanh số liệu tối giản chia vạch hairline.
 */
export function AboutAtelier() {
  const t = useTranslations("AboutPage.atelier");

  return (
    <section className="border-t border-(--border)">
      <div className={containerClassName({ spacing: "section" })}>
        <AboutHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

        {/* Mobile: vuốt ngang nhẹ; từ md: lưới 3 cột cân bằng hoàn hảo */}
        <div className="-mx-(--page-gutter) flex snap-x snap-mandatory scroll-px-(--page-gutter) gap-6 overflow-x-auto px-(--page-gutter) pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0">
          {atelierStories.map((story, i) => (
            <article
              key={story.id}
              className="group w-[82%] shrink-0 snap-start md:w-auto"
            >
              {/* Khung ảnh tối giản, tỉ lệ 3:4 thanh thoát, viền hairline bảo vệ hình học */}
              <ClipReveal delay={i * 0.12} className="aspect-[3/4] border border-(--border) bg-(--bg-secondary)">
                <Image
                  src={story.image}
                  alt={t(`stories.${story.id}.imageAlt`)}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                />
              </ClipReveal>

              <Reveal delay={0.25 + i * 0.1}>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-(--primary-ink)">
                  {t(`stories.${story.id}.role`)}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-semibold text-(--text-main) sm:text-2xl">
                  {t(`stories.${story.id}.title`)}
                </h3>
                <blockquote className="mt-3.5 border-l border-(--primary-ink)/35 pl-4 text-[15px] leading-relaxed text-(--text-main)">
                  &ldquo;{t(`stories.${story.id}.story`)}&rdquo;
                </blockquote>
              </Reveal>
            </article>
          ))}
        </div>

        {/* Thanh số liệu tối giản: Phân cách bằng hairline border thanh mảnh */}
        <dl className="mt-20 grid grid-cols-3 divide-x divide-(--border) border-y border-(--border) py-8 sm:mt-24 sm:py-10">
          {METRIC_KEYS.map((key) => (
            <div key={key} className="flex flex-col-reverse items-center justify-center px-2 text-center sm:px-6">
              <dt className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-(--text-light)">
                {t(`metrics.${key}.label`)}
              </dt>
              <dd className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-(--heading-color) sm:text-4xl lg:text-5xl">
                <CountUp value={t(`metrics.${key}.value`)} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * Đếm tăng phần số ở đầu chuỗi ("15+ năm" -> 0…15 rồi giữ "+ năm").
 * Ghi thẳng vào DOM qua ref (không setState mỗi khung hình).
 */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const match = value.match(/^(\d+)(.*)$/);
  const initialText = match ? `0${match[2]}` : value;

  useEffect(() => {
    const node = ref.current;
    const parts = value.match(/^(\d+)(.*)$/);
    if (!node || !parts) return;
    if (reduceMotion) {
      node.textContent = value;
      return;
    }
    if (!isInView) return;
    const controls = animate(0, Number(parts[1]), {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = `${Math.round(latest)}${parts[2]}`;
      },
    });
    return () => controls.stop();
  }, [isInView, reduceMotion, value]);

  return (
    <span ref={ref} aria-label={value}>
      {initialText}
    </span>
  );
}
