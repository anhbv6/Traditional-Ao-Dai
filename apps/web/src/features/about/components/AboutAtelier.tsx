"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/shared/Reveal";
import { ClipReveal } from "@/components/shared/ClipReveal";
import { cn } from "@/lib/utils";
import { AboutHeading } from "./AboutHeading";
import { atelierStories } from "../types/about.types";

const METRIC_KEYS = ["checks", "years", "consulting"] as const;

/**
 * Chân dung nghệ nhân: ảnh dọc, rê chuột thì ảnh phóng chậm và lời kể hiện rõ.
 * Bên dưới là một hàng số liệu gọn, con số đếm tăng dần khi cuộn tới.
 */
export function AboutAtelier() {
  const t = useTranslations("AboutPage.atelier");

  return (
    <section>
      <div className="mx-auto w-full max-w-[1440px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10 xl:px-16">
        <AboutHeading numeral="III" eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

        <div className="grid gap-10 md:grid-cols-3 md:gap-6 lg:gap-8">
          {atelierStories.map((story, i) => (
            // Thẻ giữa đẩy xuống một chút — nhịp so le kiểu tạp chí
            <article key={story.id} className={cn("group", i === 1 && "md:mt-16")}>
              {/* Ảnh mở như kéo màn, lần lượt từng thẻ; phần chữ hiện sau ảnh một nhịp */}
              <ClipReveal delay={i * 0.15} className="aspect-[3/4] bg-[var(--bg-secondary)]">
                <Image
                  src={story.image}
                  alt={t(`stories.${story.id}.imageAlt`)}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover grayscale-[35%] transition-[transform,filter] duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-hover:grayscale-0"
                />
                <div aria-hidden="true" className="absolute inset-4 border border-white/0 transition-colors duration-700 group-hover:border-white/60" />
              </ClipReveal>
              <Reveal delay={0.35 + i * 0.15}>
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--accent-color)]">
                  {t(`stories.${story.id}.role`)}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--primary-color)]">
                  {t(`stories.${story.id}.title`)}
                </h3>
                <p className="mt-3 border-l border-[var(--accent-color)] pl-4 font-[family-name:var(--font-playfair)] text-[15px] italic leading-7 text-[var(--text-main)]/80 transition-colors duration-700 group-hover:border-[var(--primary-color)]">
                  &ldquo;{t(`stories.${story.id}.story`)}&rdquo;
                </p>
              </Reveal>
            </article>
          ))}
        </div>

        <dl className="mt-16 grid grid-cols-3 border-t border-[var(--text-main)]/80 pt-6">
          {METRIC_KEYS.map((key) => (
            <div key={key} className="flex flex-col-reverse justify-end">
              <dt className="mt-1 text-[11px] uppercase leading-5 tracking-[2px] text-[var(--text-light)]">{t(`metrics.${key}.label`)}</dt>
              <dd className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--primary-color)] sm:text-4xl">
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
  // Có phần số -> bắt đầu từ 0 để không bị "nhảy" từ giá trị cuối về 0 khi bắt đầu đếm
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
      duration: 1.6,
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
