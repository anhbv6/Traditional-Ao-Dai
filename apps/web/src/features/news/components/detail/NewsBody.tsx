"use client";

import React from "react";
import { motion } from "motion/react";
import { Reveal } from "@/components/shared/Reveal";
import { type ArticleContent } from "../../data/articleContent";

const EASE = [0.22, 1, 0.36, 1] as const;

interface NewsBodyProps {
  content: ArticleContent;
}

/**
 * Thân bài: cột chữ ~70 ký tự/dòng, chữ cái đầu lớn kiểu tạp chí.
 * Mỗi mục hiện dần khi cuộn tới; các ý chính đánh dấu hình thoi, viền trái đỏ đô;
 * lời trích chèn sau mục thứ hai với dấu ngoặc lớn mờ dần vào.
 */
export function NewsBody({ content }: NewsBodyProps) {
  return (
    <div className="text-[15px] leading-8 text-[var(--text-main)] sm:text-[17px] sm:leading-9">
      <Reveal>
        <p className="first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-[family-name:var(--font-playfair)] first-letter:text-[60px] first-letter:font-semibold first-letter:leading-[0.85] first-letter:text-[var(--primary-color)]">
          {content.intro}
        </p>
      </Reveal>

      {content.sections.map((section, index) => (
        <React.Fragment key={section.id}>
          <section id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-28 pt-10">
            <Reveal>
              <h2
                id={`${section.id}-heading`}
                className="flex items-baseline gap-3 text-[21px] font-semibold leading-snug text-[var(--text-main)] sm:text-[26px]"
              >
                <span className="font-[family-name:var(--font-lora)] text-[13px] font-normal tracking-[2px] text-[var(--primary-color)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
            </Reveal>
            <div className="mt-4 space-y-5">
              {section.paragraphs.map((paragraph, pIndex) => (
                <Reveal key={pIndex} delay={0.05}>
                  <p>{paragraph}</p>
                </Reveal>
              ))}
            </div>

            {section.highlights?.length ? (
              <Reveal delay={0.1}>
                <ul className="mt-7 space-y-3.5 border-l-2 border-[var(--primary-color)] bg-white py-5 pl-5 pr-4 text-[15px] leading-7 sm:pl-7 sm:text-base">
                  {section.highlights.map((item, hIndex) => (
                    <motion.li
                      key={hIndex}
                      className="flex gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                      transition={{ duration: 0.5, delay: hIndex * 0.08, ease: EASE }}
                    >
                      <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rotate-45 bg-[var(--accent-color)]" />
                      <span>
                        <strong className="font-semibold text-[var(--primary-color)]">{item.bold}</strong> {item.text}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </section>

          {index === 1 ? (
            <figure className="relative my-12 border-y border-[var(--border)] py-8 text-center sm:my-14 sm:py-10">
              <motion.span
                aria-hidden="true"
                className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--bg-main)] px-3 font-[family-name:var(--font-playfair)] text-[64px] leading-none text-[var(--accent-color)]"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                &ldquo;
              </motion.span>
              <Reveal>
                <blockquote className="mx-auto max-w-xl font-[family-name:var(--font-playfair)] text-[20px] italic leading-snug text-[var(--primary-color)] sm:text-[26px]">
                  {content.quote.text}
                </blockquote>
                <figcaption className="mt-4 text-[11px] uppercase tracking-[2.5px] text-[var(--text-light)]">
                  — {content.quote.author}
                </figcaption>
              </Reveal>
            </figure>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}
