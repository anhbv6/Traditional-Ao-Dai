"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { type SectionId } from "../types/about.types";

interface SnapSectionProps {
  id: SectionId;
  children: ReactNode;
  className?: string;
}

export function SnapSection({ id, children, className }: SnapSectionProps) {
  const isLastSection = id === "testimonials";

  return (
    <motion.section
      id={`about-${id}`}
      data-about-snap-section
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.45 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex scroll-mt-24 items-center py-10 sm:py-12 lg:py-14",
        isLastSection ? "min-h-[calc(100svh-96px)]" : "h-[calc(100svh-96px)] overflow-hidden",
        className
      )}
    >
      <div className="w-full">{children}</div>
    </motion.section>
  );
}
