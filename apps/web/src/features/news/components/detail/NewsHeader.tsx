"use client";

import React from "react";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
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
      {/* Main Banner Image */}
      <div className="relative aspect-[16/10] md:aspect-[21/9] w-full overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
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
            <span className="text-xs text-[var(--text-light)] uppercase tracking-wider font-semibold">Tác giả</span>
            <span className="text-sm text-[var(--text-main)] font-semibold mt-0.5">{authorName}</span>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs text-[var(--text-light)] font-semibold font-[family-name:var(--font-lora)]">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[#800020]/75" />
            <span>{fullDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-[#800020]/75" />
            <span>{article.readTime[loc]}</span>
          </div>
        </div>
      </div>

      {/* Main Headline */}
      <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl md:text-4.5xl font-bold text-[#800020] leading-tight mb-8">
        {article.title[loc]}
      </h1>
    </>
  );
}
