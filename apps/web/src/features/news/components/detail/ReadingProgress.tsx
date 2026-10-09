"use client";

import React from "react";
import { motion, useScroll, useSpring } from "motion/react";

interface ReadingProgressProps {
  /** Phần tử thân bài — tiến độ tính từ đầu đến cuối thân bài, không tính chân trang */
  targetRef: React.RefObject<HTMLElement | null>;
}

/** Thanh tiến độ đọc mảnh màu đỏ đô dính trên cùng màn hình, chạy mượt theo lò xo */
export function ReadingProgress({ targetRef }: ReadingProgressProps) {
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start 80px", "end end"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[var(--primary-color)]"
      style={{ scaleX }}
    />
  );
}
