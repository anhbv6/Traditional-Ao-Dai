"use client";

import { useState } from "react";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";
import type { TermsSection } from "../types/terms.types";

interface TermsTocProps {
  label: string;
  sections: Pick<TermsSection, "id" | "title">[];
}

/** Mục lục bám dính (desktop) — mục đang đọc được tô màu theo vị trí cuộn */
export function TermsToc({ label, sections }: TermsTocProps) {
  const [ids] = useState(() => sections.map((section) => section.id));
  const activeId = useActiveSection(ids);

  return (
    <nav aria-label={label} className="hidden lg:block">
      <div className="sticky top-28">
        <p className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--primary-ink)]">{label}</p>
        <ol className="mt-5 space-y-1 border-l border-[var(--border)]">
          {sections.map((section) => {
            const isActive = section.id === activeId;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "-ml-px block border-l py-1.5 pl-4 text-[13px] leading-5 transition-colors duration-300 hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]",
                    isActive
                      ? "border-[var(--primary-color)] font-medium text-[var(--primary-ink)]"
                      : "border-transparent text-[var(--text-light)]",
                  )}
                >
                  {section.title}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
