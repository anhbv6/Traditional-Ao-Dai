"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "@/components/shared/Reveal";
import { AboutHeading } from "./AboutHeading";
import { containerClassName } from "@/components/layout/Container";

const PAIN_KEYS = ["armhole", "belly", "fit"] as const;

const EASE_CLASS = "ease-[cubic-bezier(0.65,0,0.35,1)]";

/**
 * 3 cột ngắn: mỗi cột một nỗi lo và cách AODAI xử lý.
 * - Mặc định chỉ hiện vấn đề (chữ rõ); phần "Cách xử lý" ẩn nhưng vẫn giữ chỗ → rê vào không làm xô lệch bố cục.
 * - Rê chuột / focus bàn phím vào cột: nét gạch ngang kẻ qua tên vấn đề, chữ nhạt đi, vạch đỏ đô chạy dài,
 *   rồi cách xử lý hiện lên.
 * - Màn cảm ứng (không có hover): hiện sẵn trạng thái đã xử lý để không bị giấu nội dung.
 * Nét gạch vẽ bằng background-image trên thẻ inline (`box-decoration-clone`) nên tiêu đề xuống dòng vẫn gạch đủ.
 */
export function AboutPainSolution() {
  const t = useTranslations("AboutPage.pain");

  return (
    <section className={containerClassName({ className: 'pb-(--section-y)' })}>
      <AboutHeading numeral="I" eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <div className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
        {PAIN_KEYS.map((key, i) => (
          <Reveal key={key} delay={i * 0.12}>
            {/* tabIndex: người dùng bàn phím cũng mở được cách xử lý */}
            <div tabIndex={0} className="group/pain cursor-default outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-main)]">
              <p className="text-[11px] uppercase tracking-[2.5px] text-[var(--text-light)]">{t("problemLabel")}</p>
              <h3
                className={`mt-2 font-[family-name:var(--font-playfair)] text-xl text-[var(--text-main)] transition-colors duration-700 ${EASE_CLASS} group-hover/pain:text-[var(--text-light)] group-focus-visible/pain:text-[var(--text-light)] [@media(hover:none)]:text-[var(--text-light)]`}
              >
                <span
                  className={`box-decoration-clone bg-[linear-gradient(var(--accent-color),var(--accent-color))] bg-[length:0%_1px] bg-[position:0_58%] bg-no-repeat transition-[background-size] duration-700 ${EASE_CLASS} group-hover/pain:bg-[length:100%_1px] group-focus-visible/pain:bg-[length:100%_1px] motion-reduce:transition-none [@media(hover:none)]:bg-[length:100%_1px]`}
                >
                  {t(`cards.${key}.title`)}
                </span>
              </h3>
              {/* Vạch đỏ đô chạy dài ra khi rê chuột */}
              <span aria-hidden="true" className="mt-6 block h-px bg-[var(--border)]">
                <span
                  className={`block h-px w-10 bg-[var(--primary-color)] transition-[width] duration-700 ${EASE_CLASS} group-hover/pain:w-full group-focus-visible/pain:w-full [@media(hover:none)]:w-full`}
                />
              </span>
              {/* Cách xử lý: hiện sau nét gạch một nhịp (delay) */}
              <div
                className={`translate-y-2 opacity-0 transition-[opacity,translate] duration-500 ${EASE_CLASS} group-hover/pain:translate-y-0 group-hover/pain:opacity-100 group-hover/pain:delay-300 group-focus-visible/pain:translate-y-0 group-focus-visible/pain:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-opacity [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100`}
              >
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--primary-ink)]">{t("fixLabel")}</p>
                <p className="mt-2 text-[15px] leading-7 text-[var(--text-main)]">{t(`cards.${key}.fix`)}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
