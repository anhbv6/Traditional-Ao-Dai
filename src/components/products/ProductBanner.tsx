"use client";

import React, { useState, useEffect } from "react";
import { MorphingText } from "@/components/ui/morphing-text";
import LoadingAnimation from "@/components/LoadingAnimation";

interface ProductBannerProps {
  title: string;
  subtitle: string;
  texts: string[];
}

export function ProductBanner({ title, subtitle, texts }: ProductBannerProps) {
  const [leaves, setLeaves] = useState<{
    id: number;
    top: number;
    left: number;
    scale: number;
    rotate: number;
    opacity: number;
  }[]>([]);

  useEffect(() => {
    // Generate 25 leaves with random coordinates
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      top: Math.random() * 85, // 0% to 85%
      left: Math.random() * 92, // 0% to 92%
      scale: 0.5 + Math.random() * 0.9, // scale 0.5 to 1.4
      rotate: Math.random() * 360,
      opacity: 0.05 + Math.random() * 0.13, // opacity 0.05 to 0.18
    }));
    setLeaves(generated);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[#E2A79E]/20 bg-gradient-to-br from-[#800020] via-[#941C34] to-[#A82B44] px-6 py-10 md:px-12 md:py-14 shadow-lg">
      {/* Decorative vector overlays for a premium look */}
      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#E2A79E]/10 blur-3xl pointer-events-none" />
      
      {/* Scattered dynamic leaf watermark animations (using mix-blend-multiply to remove white bg) */}
      {leaves.map((leaf) => (
        <LoadingAnimation
          key={leaf.id}
          className="absolute pointer-events-none mix-blend-multiply"
          style={{
            top: `${leaf.top}%`,
            left: `${leaf.left}%`,
            transform: `scale(${leaf.scale}) rotate(${leaf.rotate}deg)`,
            opacity: leaf.opacity,
            width: '300px',
            height: '300px',
          }}
        />
      ))}

      <div className="relative z-10 grid gap-8 md:grid-cols-2 items-center">
        {/* Left column - Branding and Title */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-[3px] text-[#E2A79E]">
              AODAI Premium
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 font-[family-name:var(--font-lora)]">
            {subtitle}
          </p>
        </div>

        {/* Right column - Morphing text */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-sm shadow-inner flex items-center justify-center min-h-[120px] md:min-h-[140px]">
            <MorphingText 
              texts={texts} 
              className="!text-3xl md:!text-4xl lg:!text-5xl !font-[family-name:var(--font-dancing)] !text-[#E2A79E] !h-12 md:!h-14 !max-w-full !m-0 !relative flex items-center justify-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
