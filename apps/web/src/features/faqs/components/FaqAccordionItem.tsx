"use client";

import React from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getHighlightParts } from "@/features/products";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface FaqAccordionItemProps {
  id: string;
  /** Số thứ tự trong nhóm ("01", "02"...) */
  index: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  /** Từ khoá đang tìm — tô nền phần khớp (không phân biệt dấu) */
  query: string;
}

/** Tô nền phần chữ khớp từ khoá tìm kiếm */
function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  return (
    <>
      {getHighlightParts(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="bg-[var(--accent-color)]/35 text-inherit">
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
}

/**
 * Một câu hỏi dạng mở/đóng: số thứ tự nghiêng — câu hỏi Playfair — dấu "+" xoay thành "×".
 * Nút mang aria-expanded / aria-controls; câu trả lời mở ra mượt bằng chiều cao tự động.
 */
export function FaqAccordionItem({ id, index, question, answer, isOpen, onToggle, query }: FaqAccordionItemProps) {
  const buttonId = `faq-${id}-button`;
  const panelId = `faq-${id}-panel`;

  return (
    <div className="border-b border-[var(--border)]">
      <h3 className="m-0 text-base">
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full cursor-pointer items-start gap-3 py-5 text-left outline-none focus-visible:bg-[var(--bg-secondary)]/60 sm:gap-4 sm:py-6"
        >
          <span className="mt-0.5 w-7 shrink-0 font-[family-name:var(--font-playfair)] text-sm italic text-[var(--primary-ink)] sm:mt-1">{index}</span>
          <span
            className={cn(
              "flex-1 font-[family-name:var(--font-playfair)] text-[1.0625rem] font-semibold leading-snug transition-colors sm:text-lg 2xl:text-xl",
              isOpen ? "text-[var(--primary-ink)]" : "text-[var(--text-main)] group-hover:text-[var(--primary-ink)]"
            )}
          >
            <Highlighted text={question} query={query} />
          </span>
          <Plus
            size={20}
            strokeWidth={1.4}
            aria-hidden="true"
            className={cn("mt-0.5 shrink-0 text-[var(--primary-ink)] transition-transform duration-300 sm:mt-1", isOpen && "rotate-45")}
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 pl-10 pr-8 text-[15px] leading-7 text-[var(--text-light)] sm:pl-11 sm:pr-10">
              <Highlighted text={answer} query={query} />
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
