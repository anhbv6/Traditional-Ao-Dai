"use client";

import React from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Search, ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useFaqs } from "../hooks/useFaqs";
import { type CategoryId } from "../types/faqs.types";

export function FaqsExperience() {
  const {
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
  } = useFaqs();

  return (
    <Container as="section" className="py-12 bg-[#FAF7F5] min-h-screen overflow-x-hidden">
      <Breadcrumbs />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#800020] sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm text-[#706565] leading-relaxed">
          {t("subtitle")}
        </p>

        {/* Search Bar */}
        <div className="relative mt-8 max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#706565]/60" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[#E2D9D2] bg-white py-3.5 pl-12 pr-6 text-sm text-[#2A2525] outline-none shadow-sm transition-all focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
          />
        </div>
      </div>

      {/* Layout Content */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr] w-full max-w-full">
        {/* Left Side: Category Navigator */}
        <aside className="space-y-2 w-full overflow-hidden">
          {/* Desktop Categories */}
          <nav className="hidden lg:block space-y-1.5 rounded-2xl border border-[#800020]/10 bg-white p-3 shadow-sm">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setOpenId(null); // Close active accordion
                  }}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                    activeCategory === cat.id
                      ? "bg-[#800020] text-white shadow-sm"
                      : "text-[#706565] hover:bg-[#FAF7F5] hover:text-[#800020]"
                  )}
                >
                  <Icon size={18} className={cn("shrink-0", activeCategory === cat.id ? "text-white" : "text-[#706565]/80")} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Swipeable Categories */}
          <div className="flex lg:hidden overflow-x-auto pb-4 gap-2 scrollbar-none -mx-5 px-5 select-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setOpenId(null);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border shrink-0",
                    isActive
                      ? "bg-[#800020] border-[#800020] text-white shadow-sm"
                      : "bg-white border-[#E2D9D2] text-[#706565] hover:border-[#800020]/20"
                  )}
                >
                  <Icon size={13} className="shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Side: Accordion Questions */}
        <main className="space-y-4 min-w-0 w-full">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-[#E2D9D2]/70 bg-white p-12 text-center shadow-sm">
              <HelpCircle size={40} className="mx-auto text-[#706565]/40" />
              <p className="mt-4 text-sm text-[#706565]">
                {t("noResults")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={cn(
                       "overflow-hidden rounded-xl border transition-all duration-300 shadow-sm",
                       isOpen
                         ? "border-[#800020]/30 bg-white"
                         : "border-[#E2D9D2]/70 bg-white hover:border-[#800020]/20"
                    )}
                  >
                    {/* Trigger button */}
                    <button
                      onClick={() => toggleOpen(faq.id)}
                      className="flex w-full items-center justify-between gap-4 px-4 sm:px-6 py-3.5 sm:py-4.5 text-left outline-none"
                    >
                      <span className="font-[family-name:var(--font-playfair)] text-sm sm:text-base font-semibold text-[#800020] whitespace-normal break-words flex-1">
                        {faq.question}
                      </span>
                      <ChevronDown
                        size={18}
                        className={cn(
                          "shrink-0 text-[#706565] transition-transform duration-300",
                          isOpen && "rotate-180 text-[#800020]"
                        )}
                      />
                    </button>

                    {/* Content Answer Panel */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                        >
                          <div className="border-t border-[#E2D9D2]/40 bg-[#FAF7F5]/30 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[#2A2525] leading-relaxed font-[family-name:var(--font-lora)]">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </Container>
  );
}
