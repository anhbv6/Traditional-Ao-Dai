"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ArticleSection } from "../../data/articleContent";

/** Khoảng chừa cho header dính khi cuộn tới mục */
const SCROLL_OFFSET = -110;

interface NewsTocProps {
  sections: ArticleSection[];
  /** `sidebar`: cột dính bên trái (desktop) · `inline`: hộp thu gọn đầu bài (mobile) */
  variant: "sidebar" | "inline";
}

/** Theo dõi mục đang đọc bằng IntersectionObserver (mục gần mép trên màn hình nhất) */
function useActiveSection(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveId(visible[0].target.id);
        }
      },
      // Vùng "đang đọc": dải từ 20% đến 45% chiều cao màn hình
      { rootMargin: "-20% 0px -55% 0px" }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

/**
 * Mục lục bài viết. Bấm mục -> cuộn mượt (Lenis) tới tiêu đề; mục đang đọc có vạch đỏ đô trượt theo.
 */
export function NewsToc({ sections, variant }: NewsTocProps) {
  const t = useTranslations("NewsPage");
  const lenis = useLenis();
  const [ids] = useState(() => sections.map((section) => section.id));
  const activeId = useActiveSection(ids);
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: SCROLL_OFFSET, duration: 1.2 });
    else target.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  const list = (
    <ol className="space-y-0.5">
      {sections.map((section, index) => {
        const isActive = section.id === activeId;
        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={scrollTo(section.id)}
              aria-current={isActive ? "location" : undefined}
              className={`relative flex gap-2.5 py-2 pl-4 text-[13px] leading-5 transition-colors duration-300 ${
                isActive ? "text-[var(--primary-color)]" : "text-[var(--text-light)] hover:text-[var(--text-main)]"
              }`}
            >
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-[var(--border)]" />
              {isActive ? (
                <motion.span
                  layoutId={`news-toc-active-${variant}`}
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-0.5 bg-[var(--primary-color)]"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              ) : null}
              <span className="text-[11px] tracking-[1px]">{String(index + 1).padStart(2, "0")}</span>
              <span>{section.heading}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  if (variant === "sidebar") {
    return (
      <nav aria-label={t("toc")}>
        <p className="mb-3 text-[10px] uppercase tracking-[2.5px] text-[var(--text-light)]">{t("toc")}</p>
        {list}
      </nav>
    );
  }

  return (
    <nav aria-label={t("toc")} className="mb-8 border border-[var(--border)] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[2px] text-[var(--text-main)]"
      >
        {t("toc")}
        <ChevronDown size={15} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">{list}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
