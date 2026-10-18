"use client";

import React from "react";
import { MessageCircleQuestion, Search } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageIntro } from "@/components/shared/PageIntro";
import { TextField } from "@/components/shared/TextField";
import { useFaqs } from "../hooks/useFaqs";
import { FaqAccordionItem } from "./FaqAccordionItem";
import { FaqTopicNav } from "./FaqTopicNav";
import { FaqsCta } from "./FaqsCta";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Trang Câu hỏi thường gặp — cùng ngôn ngữ biên tập với Liên hệ / Tin tức:
 * tiêu đề căn trái → (desktop) cột trái dính: ô tìm kiếm + danh sách chủ đề; cột phải: câu hỏi gom theo chủ đề.
 * Mobile / tablet: ô tìm kiếm rồi tab chủ đề vuốt ngang. Cuối trang: lối sang Liên hệ / hotline.
 */
export function FaqsExperience() {
  const { t, searchQuery, setSearchQuery, activeCategory, selectCategory, resetFilters, openId, toggleOpen, categories, groups, resultCount } =
    useFaqs();

  return (
    <MotionConfig reducedMotion="user">
      <PageIntro eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-10 grid gap-6 sm:mt-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-20">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <TextField
            type="search"
            label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            prefix={<Search size={16} strokeWidth={1.6} />}
            clearable
            value={searchQuery}
            onValueChange={(value) => setSearchQuery(value)}
          />
          <FaqTopicNav
            variant="sidebar"
            className="mt-10 hidden lg:block"
            label={t("categoriesLabel")}
            topics={categories}
            active={activeCategory}
            onSelect={selectCategory}
          />
        </aside>

        <div className="min-w-0">
          <FaqTopicNav variant="tabs" className="lg:hidden" label={t("categoriesLabel")} topics={categories} active={activeCategory} onSelect={selectCategory} />

          <p className="mt-6 text-xs uppercase tracking-[2px] text-[var(--text-light)] lg:mt-0" aria-live="polite">
            {t("resultCount", { count: resultCount })}
          </p>

          {groups.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={MessageCircleQuestion}
                title={t("noResultsTitle")}
                description={t("noResults")}
                action={t("resetFilters")}
                onAction={resetFilters}
              />
            </div>
          ) : (
            // key theo chủ đề -> đổi chủ đề thì danh sách hiện dần lại (gõ tìm kiếm thì không nháy)
            <motion.div key={activeCategory} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
              {groups.map((group) => (
                <section key={group.id} aria-labelledby={`faq-group-${group.id}`} className="mt-8 first:mt-6 sm:mt-12 sm:first:mt-8">
                  <div className="flex items-end justify-between gap-4 border-b border-[var(--text-main)]/80 pb-3">
                    <h2
                      id={`faq-group-${group.id}`}
                      className="font-[family-name:var(--font-playfair)] text-[1.25rem] font-semibold leading-tight text-[var(--primary-ink)] sm:text-2xl"
                    >
                      {group.label}
                    </h2>
                    <span className="pb-0.5 text-xs tabular-nums text-[var(--text-light)]">{String(group.items.length).padStart(2, "0")}</span>
                  </div>

                  {group.items.map((item, index) => (
                    <FaqAccordionItem
                      key={item.id}
                      id={item.id}
                      index={String(index + 1).padStart(2, "0")}
                      question={item.question}
                      answer={item.answer}
                      isOpen={openId === item.id}
                      onToggle={() => toggleOpen(item.id)}
                      query={searchQuery}
                    />
                  ))}
                </section>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <FaqsCta />
    </MotionConfig>
  );
}
