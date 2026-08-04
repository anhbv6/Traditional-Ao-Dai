"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { HelpCircle, Scissors, Truck, Sparkles, Receipt } from "lucide-react";
import { type CategoryId, type FaqItem } from "../types/faqs.types";

export function useFaqs() {
  const t = useTranslations("FaqsPage");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = useMemo(() => [
    { id: "all" as const, label: t("categories.all"), icon: HelpCircle },
    { id: "sizing" as const, label: t("categories.sizing"), icon: Scissors },
    { id: "shipping" as const, label: t("categories.shipping"), icon: Truck },
    { id: "materials" as const, label: t("categories.materials"), icon: Sparkles },
    { id: "refunds" as const, label: t("categories.refunds"), icon: Receipt },
  ], [t]);

  const faqItems: FaqItem[] = useMemo(() => {
    return [
      {
        id: "q1",
        category: "sizing",
        question: t("questions.q1.question"),
        answer: t("questions.q1.answer"),
      },
      {
        id: "q2",
        category: "sizing",
        question: t("questions.q2.question"),
        answer: t("questions.q2.answer"),
      },
      {
        id: "q3",
        category: "shipping",
        question: t("questions.q3.question"),
        answer: t("questions.q3.answer"),
      },
      {
        id: "q4",
        category: "shipping",
        question: t("questions.q4.question"),
        answer: t("questions.q4.answer"),
      },
      {
        id: "q5",
        category: "materials",
        question: t("questions.q5.question"),
        answer: t("questions.q5.answer"),
      },
      {
        id: "q6",
        category: "materials",
        question: t("questions.q6.question"),
        answer: t("questions.q6.answer"),
      },
      {
        id: "q7",
        category: "refunds",
        question: t("questions.q7.question"),
        answer: t("questions.q7.answer"),
      },
      {
        id: "q8",
        category: "refunds",
        question: t("questions.q8.question"),
        answer: t("questions.q8.answer"),
      },
    ];
  }, [t]);

  const filteredFaqs = useMemo(() => {
    return faqItems.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqItems, activeCategory, searchQuery]);

  const toggleOpen = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    openId,
    setOpenId,
    categories,
    filteredFaqs,
    toggleOpen,
    t,
  };
}
