"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useTranslations } from "next-intl";

/**
 * Câu triết lý căn trái, nhãn chữ dọc bên cạnh: từng chữ sáng dần theo nhịp cuộn —
 * khách "đọc" cùng tốc độ cuộn của mình, là điểm dừng mắt tự nhiên giữa trang.
 * Giảm chuyển động: xử lý bằng CSS `motion-reduce:` (không rẽ nhánh JS -> server/client render giống nhau).
 */
export function AboutManifesto() {
  const t = useTranslations("AboutPage.manifesto");
  const textRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: textRef, offset: ["start 0.85", "end 0.5"] });

  const words = t("text").split(" ");

  return (
    <section className="mx-auto grid w-full max-w-[1440px] gap-6 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[80px_1fr] lg:gap-10 lg:px-10 xl:px-16">
      <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)] lg:mt-3 lg:[writing-mode:vertical-rl] lg:rotate-180">
        {t("eyebrow")}
      </p>

      <div className="max-w-5xl">
        <p
          ref={textRef}
          className="font-[family-name:var(--font-playfair)] text-[26px] leading-[1.45] text-[var(--primary-color)] sm:text-[38px] lg:text-[46px]"
        >
          {words.map((word, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {word}
            </Word>
          ))}
        </p>
        <p className="mt-8 flex items-center gap-4 text-xs uppercase tracking-[2.5px] text-[var(--text-light)]">
          <span aria-hidden="true" className="h-px w-12 bg-[var(--accent-color)]" />
          {t("author")}
        </p>
      </div>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="motion-reduce:opacity-100!">
      {children}{" "}
    </motion.span>
  );
}
