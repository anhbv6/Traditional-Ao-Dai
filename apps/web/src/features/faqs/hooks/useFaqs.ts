"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { normalizeSearchText, tokenizeQuery } from "@/features/products";
import { FAQ_ENTRIES, FAQ_TOPICS, type CategoryId, type FaqItem, type FaqTopicId } from "../types/faqs.types";

export interface FaqGroup {
  id: FaqTopicId;
  label: string;
  items: FaqItem[];
}

export function useFaqs() {
  const t = useTranslations("FaqsPage");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const faqItems: FaqItem[] = useMemo(
    () =>
      FAQ_ENTRIES.map(({ id, category }) => ({
        id,
        category,
        question: t(`questions.${id}.question`),
        answer: t(`questions.${id}.answer`),
      })),
    [t]
  );

  // Tìm không phân biệt dấu / hoa thường; câu hỏi phải chứa đủ mọi từ khoá (ở câu hỏi hoặc câu trả lời)
  const searchMatches = useMemo(() => {
    const tokens = tokenizeQuery(searchQuery);
    if (tokens.length === 0) return faqItems;
    return faqItems.filter((item) => {
      const haystack = normalizeSearchText(`${item.question} ${item.answer}`);
      return tokens.every((token) => haystack.includes(token));
    });
  }, [faqItems, searchQuery]);

  /** Số câu hỏi khớp từ khoá theo từng chủ đề — hiện cạnh tên chủ đề */
  const categories = useMemo(() => {
    const countOf = (id: CategoryId) =>
      id === "all" ? searchMatches.length : searchMatches.filter((item) => item.category === id).length;
    return (["all", ...FAQ_TOPICS] as const).map((id) => ({ id, label: t(`categories.${id}`), count: countOf(id) }));
  }, [searchMatches, t]);

  /** Kết quả gom theo chủ đề (giữ thứ tự chủ đề) — bỏ nhóm rỗng */
  const groups: FaqGroup[] = useMemo(
    () =>
      FAQ_TOPICS.filter((id) => activeCategory === "all" || activeCategory === id)
        .map((id) => ({ id, label: t(`categories.${id}`), items: searchMatches.filter((item) => item.category === id) }))
        .filter((group) => group.items.length > 0),
    [activeCategory, searchMatches, t]
  );

  const resultCount = groups.reduce((sum, group) => sum + group.items.length, 0);

  const selectCategory = (id: CategoryId) => {
    setActiveCategory(id);
    setOpenId(null);
  };

  const resetFilters = () => {
    setSearchQuery("");
    selectCategory("all");
  };

  const toggleOpen = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return {
    t,
    searchQuery,
    setSearchQuery,
    activeCategory,
    selectCategory,
    resetFilters,
    openId,
    toggleOpen,
    categories,
    groups,
    resultCount,
  };
}
