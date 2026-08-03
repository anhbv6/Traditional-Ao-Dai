"use client";

import React from "react";

interface HighlightItem {
  bold: string;
  text: string;
}

interface ArticleContent {
  paragraphs: string[];
  highlights: HighlightItem[];
}

interface NewsBodyProps {
  content: ArticleContent;
}

export function NewsBody({ content }: NewsBodyProps) {
  return (
    <div className="prose max-w-none font-[family-name:var(--font-lora)] text-[13px] sm:text-sm md:text-base text-[var(--text-main)] leading-relaxed space-y-6">
      {content.paragraphs.slice(0, 2).map((para, idx) => (
        <p key={idx}>{para}</p>
      ))}

      {/* Bullet Highlights */}
      {content.highlights.length > 0 && (
        <ul className="list-disc pl-5 my-6 space-y-3.5 text-[13px] sm:text-sm md:text-base leading-relaxed text-[var(--text-main)]">
          {content.highlights.map((highlight, idx) => (
            <li key={idx} className="marker:text-[var(--primary-color)]">
              <strong>{highlight.bold}</strong> {highlight.text}
            </li>
          ))}
        </ul>
      )}

      {content.paragraphs.slice(2).map((para, idx) => (
        <p key={idx}>{para}</p>
      ))}
    </div>
  );
}
