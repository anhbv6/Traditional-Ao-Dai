"use client";

import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { type MockArticle } from "../../types/news.types";

interface SimilarNewsProps {
  similarArticles: MockArticle[];
  loc: "vi" | "en";
}

export function SimilarNews({ similarArticles, loc }: SimilarNewsProps) {
  const t = useTranslations("NewsPage");

  return (
    <section className="mt-16 pt-10 border-t border-[var(--border)]">
      <div className="flex items-end justify-between border-b border-[var(--border)] pb-2 mb-6">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold uppercase tracking-wider text-[var(--primary-color)]">
          {t('similarNews')}
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {similarArticles.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.slug}`}
            className="group block"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] group-hover:border-[var(--accent-color)] transition-all duration-300 shadow-xs">
              <Image
                src={item.imageSrc}
                alt={item.title[loc]}
                fill
                sizes="(max-width: 640px) 100vw, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-[10px] sm:text-xs font-[family-name:var(--font-lora)] text-[var(--text-light)]/80">
              <span className="font-semibold text-[var(--accent-color)]">{item.category[loc]}</span>
              <span>—</span>
              <span>{item.dateShort[loc]}</span>
            </div>
            <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-sm sm:text-base font-bold text-[var(--primary-color)] leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-[var(--accent-color)]">
              {item.title[loc]}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
