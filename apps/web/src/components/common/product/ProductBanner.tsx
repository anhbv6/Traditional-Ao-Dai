"use client";

import React from "react";
import { MorphingText } from "@/components/ui/morphing-text";

interface ProductBannerProps {
  title: string;
  subtitle: string;
  texts: string[];
}

// Generate 25 pseudo-random leaves deterministically to avoid hydration mismatches
// and eliminate the layout-triggering useEffect/useState
const LEAVES = Array.from({ length: 25 }).map((_, i) => {
  // Simple deterministic pseudo-random generator
  const topSeed = Math.sin(i * 12.9898 + 78.233) * 43758.5453123;
  const leftSeed = Math.sin(i * 4.1414 + 12.9898) * 43758.5453123;
  const scaleSeed = Math.sin(i * 9.8765 + 4.1414) * 43758.5453123;
  const rotateSeed = Math.sin(i * 3.1415 + 9.8765) * 43758.5453123;
  const opacitySeed = Math.sin(i * 7.1234 + 3.1415) * 43758.5453123;

  const top = (topSeed - Math.floor(topSeed)) * 85;
  const left = (leftSeed - Math.floor(leftSeed)) * 92;
  const scale = 0.5 + (scaleSeed - Math.floor(scaleSeed)) * 0.9;
  const rotate = (rotateSeed - Math.floor(rotateSeed)) * 360;
  const opacity = 0.05 + (opacitySeed - Math.floor(opacitySeed)) * 0.13;

  return { id: i, top, left, scale, rotate, opacity };
});

export function ProductBanner({ title, subtitle, texts }: ProductBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[#E2A79E]/20 bg-gradient-to-br from-[#800020] via-[#941C34] to-[#A82B44] px-6 py-10 md:px-12 md:py-14 shadow-lg">
      <style>{`
        @keyframes leafFloat {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(8px, -12px) rotate(4deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
      `}</style>

      {/* Decorative vector overlays for a premium look */}
      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#E2A79E]/10 blur-3xl pointer-events-none" />
      
      {/* Scattered dynamic leaf watermark animations (using lightweight SVG paths) */}
      {LEAVES.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute pointer-events-none mix-blend-multiply"
          style={{
            top: `${leaf.top.toFixed(4)}%`,
            left: `${leaf.left.toFixed(4)}%`,
            opacity: leaf.opacity.toFixed(3),
            width: "80px",
            height: "80px",
            animation: `leafFloat ${10 + (leaf.id % 5) * 2}s ease-in-out -${leaf.id * 2}s infinite`,
          }}
        >
          <svg
            viewBox="-110 -70 220 140"
            className="w-full h-full text-[#44b875]"
            style={{
              transform: `scale(${leaf.scale.toFixed(3)}) rotate(${leaf.rotate.toFixed(2)}deg)`,
            }}
          >
            <path
              d="M 16.196 49.845 C -25.565 63.414, -69.108 56.028, -103.037 33.479 C -88.842 -4.706, -57.956 -36.276, -16.195 -49.845 C 25.566 -63.414, 69.099 -56.025, 103.037 -33.479 C 88.832 4.71, 57.957 36.276, 16.196 49.845 Z"
              fill="currentColor"
            />
          </svg>
        </div>
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
