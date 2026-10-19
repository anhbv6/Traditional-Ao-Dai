"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { CategoryId } from "../types/faqs.types";

interface FaqTopic {
  id: CategoryId;
  label: string;
  count: number;
}

interface FaqTopicNavProps {
  topics: FaqTopic[];
  active: CategoryId;
  onSelect: (id: CategoryId) => void;
  label: string;
  /** `sidebar`: danh sách dọc có vạch đỏ đô bên trái (desktop). `tabs`: tab ngang vuốt được (mobile / tablet) */
  variant: "sidebar" | "tabs";
  className?: string;
}

/** Chọn chủ đề câu hỏi — kèm số câu hỏi khớp từ khoá của từng chủ đề */
export function FaqTopicNav({ topics, active, onSelect, label, variant, className }: FaqTopicNavProps) {
  if (variant === "sidebar") {
    return (
      <nav aria-label={label} className={className}>
        <p className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">{label}</p>
        <ul className="mt-4 border-l border-[var(--border)]">
          {topics.map((topic) => {
            const isActive = topic.id === active;
            return (
              <li key={topic.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelect(topic.id)}
                  className={cn(
                    "-ml-px flex w-full cursor-pointer items-center justify-between gap-3 border-l-2 py-2.5 pl-4 text-left text-sm transition-colors duration-300",
                    isActive
                      ? "border-[var(--primary-color)] font-semibold text-[var(--primary-ink)]"
                      : "border-transparent text-[var(--text-light)] hover:text-[var(--text-main)]",
                    topic.count === 0 && !isActive && "opacity-50"
                  )}
                >
                  <span>{topic.label}</span>
                  <span className="text-xs tabular-nums">{String(topic.count).padStart(2, "0")}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={label} className={cn("border-y border-[var(--border)]", className)}>
      <div className="-mx-(--page-gutter) flex items-center gap-1 overflow-x-auto px-(--page-gutter) [scrollbar-width:none] sm:-mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {topics.map((topic) => {
          const isActive = topic.id === active;
          return (
            <button
              key={topic.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect(topic.id)}
              className={cn(
                "relative shrink-0 cursor-pointer whitespace-nowrap px-3 py-3.5 text-[11px] font-semibold uppercase tracking-[1.8px] transition-colors duration-300",
                isActive ? "text-[var(--primary-ink)]" : "text-[var(--text-light)] hover:text-[var(--primary-ink)]"
              )}
            >
              {topic.label}
              <sup className="ml-1 text-[9px] tabular-nums tracking-normal">{topic.count}</sup>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-3 -bottom-px h-0.5 origin-center bg-[var(--primary-color)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isActive ? "scale-x-100" : "scale-x-0"
                )}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
