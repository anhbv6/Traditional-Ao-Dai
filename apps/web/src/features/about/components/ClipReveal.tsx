'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Điểm bắt đầu của "tấm màn" — mép đối diện với hướng mở */
const HIDDEN_CLIP = {
  up: 'inset(100% 0% 0% 0%)',
  right: 'inset(0% 100% 0% 0%)',
} as const;

interface ClipRevealProps {
  /** Nội dung dạng lấp đầy (vd. `next/image` với `fill`) — được đặt trong lớp `absolute inset-0` */
  children: React.ReactNode;
  /** Class cho khung ngoài (kích thước, tỉ lệ khung hình, nền) */
  className?: string;
  /** Hướng mở màn: `up` — từ dưới lên, `right` — từ trái sang phải */
  direction?: keyof typeof HIDDEN_CLIP;
  delay?: number;
}

/**
 * Hé lộ ảnh khi cuộn tới như kéo một tấm màn vải, ảnh bên trong thu nhỏ dần về kích thước thật.
 * `initial` giống nhau ở server/client (tránh hydration mismatch); giảm chuyển động -> thời lượng 0.
 */
export function ClipReveal({ children, className, direction = 'up', delay = 0 }: ClipRevealProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 1.4, delay, ease: EASE };

  return (
    <motion.div
      className={`relative overflow-hidden ${className ?? ''}`}
      initial={{ clipPath: HIDDEN_CLIP[direction] }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={transition}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.18 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={reduceMotion ? { duration: 0 } : { duration: 1.8, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
