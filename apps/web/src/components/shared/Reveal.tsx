'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  /** Độ trễ (giây) — dùng để tạo hiệu ứng lần lượt cho các phần tử cùng hàng */
  delay?: number;
  className?: string;
}

/**
 * Hiện dần nội dung khi cuộn tới (chỉ chạy một lần).
 * Tôn trọng `prefers-reduced-motion`: người dùng tắt hiệu ứng sẽ thấy nội dung hiện ngay (thời lượng 0).
 * `initial` luôn giống nhau ở server và client — server không biết cài đặt giảm chuyển động,
 * đổi `initial` theo cài đặt đó sẽ gây lỗi hydration mismatch.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
