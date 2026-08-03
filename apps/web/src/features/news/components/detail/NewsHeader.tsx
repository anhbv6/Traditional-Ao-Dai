"use client";

import React from "react";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { type MockArticle } from "../../types/news.types";

interface NewsHeaderProps {
  article: MockArticle;
  authorName: string;
  fullDate: string;
  loc: "vi" | "en";
}

export function NewsHeader({ article, authorName, fullDate, loc }: NewsHeaderProps) {
  return (
    <>
      <Breadcrumbs />

      {/* Main Banner Image */}
      <div className="relative aspect-[16/10] md:aspect-[21/9] w-full overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm mt-6">
        <Image
          src={article.imageSrc}
          alt={article.title[loc]}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Author & Date Meta Block */}
      <div className="border-y border-[var(--border)] py-4 my-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar mockup */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] shrink-0">
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
              alt={authorName}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center font-[family-name:var(--font-lora)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">{authorName}</span>
            <span className="text-[11px] text-[var(--text-light)] mt-0.5 flex items-center gap-1 font-semibold">
              <Calendar size={11} className="text-[var(--primary-color)]" />
              {fullDate}
            </span>
          </div>
        </div>
        <div className="text-xs text-[var(--text-light)] font-semibold font-[family-name:var(--font-lora)] flex items-center gap-1">
          <Clock size={12} className="text-[var(--primary-color)]" />
          <span>{article.readTime[loc]}</span>
        </div>
      </div>

      {/* Article Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-[family-name:var(--font-playfair)] font-bold text-[var(--primary-color)] uppercase tracking-wide leading-tight mt-4">
        {article.title[loc]}
      </h1>
      <div className="border-b border-[var(--border)] pb-6 mb-8" />
    </>
  );
}
