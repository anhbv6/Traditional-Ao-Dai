"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ActionButton } from "./ActionButton";
import { ActionLink } from "./ActionLink";
import { SectionOrnament } from "./SectionOrnament";

const EASE = [0.22, 1, 0.36, 1] as const;

interface EmptyStateProps {
  icon: LucideIcon;
  /** Nhãn nhỏ phía trên tiêu đề (VD "Danh sách yêu thích") */
  eyebrow?: string;
  title: string;
  description: string;
  /** Nhãn nút chính */
  action: string;
  /** Đích của nút chính */
  href?: string;
  /** Truyền vào thì nút chính thành <button> gọi hàm này (VD xoá bộ lọc) thay vì chuyển trang */
  onAction?: () => void;
  /** Link phụ dạng chữ gạch chân bên cạnh nút chính */
  secondaryAction?: { label: string; href: string };
  /** Gợi ý thêm bên dưới (VD chip danh mục, câu hỏi phổ biến) — hiện sau cùng */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Trạng thái trống dùng chung (giỏ hàng, yêu thích, tìm kiếm không có kết quả…):
 * - Icon trong khung thoi đôi (cùng hoạ tiết SectionOrnament / logo), khung tự vẽ viền, icon "thở" nhẹ.
 * - Eyebrow → tiêu đề Playfair → mô tả → hoạ tiết phân cách → nút chính (ActionLink / ActionButton) + link phụ.
 * - `children`: gợi ý đi tiếp (chip danh mục, câu hỏi phổ biến…) để khách không bị "kẹt" ở trang trống.
 * Mọi phần hiện lần lượt từ trên xuống.
 */
export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  href = "/products",
  onAction,
  secondaryAction,
  children,
  className,
}: EmptyStateProps) {
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("mx-auto flex max-w-xl flex-col items-center px-4 py-14 text-center sm:py-20", className)}
    >
      {/* Icon trong khung thoi đôi: thoi ngoài tự vẽ viền, thoi trong mờ hơn */}
      <div className="relative grid size-24 place-items-center sm:size-28">
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <motion.path
            d="M50 2 L98 50 L50 98 L2 50 Z"
            stroke="var(--primary-color)"
            strokeOpacity="0.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: EASE }}
          />
          <motion.path
            d="M50 16 L84 50 L50 84 L16 50 Z"
            stroke="var(--accent-color)"
            strokeOpacity="0.6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.2, ease: EASE }}
          />
        </svg>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [1, 1.1, 1], opacity: 1 }}
          transition={{
            opacity: { duration: 0.5, delay: 0.3 },
            scale: { duration: 2.6, delay: 0.6, repeat: Infinity, ease: "easeInOut" },
          }}
          className="text-[var(--primary-ink)]"
        >
          <Icon size={26} strokeWidth={1.3} />
        </motion.div>
      </div>

      {eyebrow ? (
        <motion.p {...reveal(0.2)} className="mt-7 text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)]">
          {eyebrow}
        </motion.p>
      ) : null}
      <motion.h2
        {...reveal(0.25)}
        className={cn(
          "font-[family-name:var(--font-playfair)] text-[1.5rem] font-semibold leading-tight text-[var(--text-main)] sm:text-[1.875rem]",
          eyebrow ? "mt-3" : "mt-7",
        )}
      >
        {title}
      </motion.h2>
      <motion.p {...reveal(0.35)} className="mt-3 max-w-md text-[14px] leading-7 text-[var(--text-light)]">
        {description}
      </motion.p>
      <motion.div {...reveal(0.4)}>
        <SectionOrnament className="mt-6" />
      </motion.div>

      <motion.div {...reveal(0.45)} className="mt-7 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        {onAction ? (
          <ActionButton variant="confirm" size="lg" icon={<ArrowRight />} iconPosition="end" onClick={onAction}>
            {action}
          </ActionButton>
        ) : (
          <ActionLink href={href} variant="confirm" size="lg" icon={<ArrowRight />} iconPosition="end">
            {action}
          </ActionLink>
        )}
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className="border-b border-[var(--primary-color)]/30 pb-0.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
          >
            {secondaryAction.label}
          </Link>
        ) : null}
      </motion.div>

      {children ? (
        <motion.div {...reveal(0.6)} className="mt-12 w-full">
          {children}
        </motion.div>
      ) : null}
    </motion.div>
  );
}

interface EmptyStateLinksProps {
  title: string;
  links: { label: string; href: string }[];
}

/** Gợi ý đi tiếp dạng chip (đặt làm `children` của EmptyState) — VD các bộ sưu tập nổi bật */
export function EmptyStateLinks({ title, links }: EmptyStateLinksProps) {
  return (
    <nav aria-label={title}>
      <p className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">{title}</p>
      <ul className="mt-4 flex flex-wrap justify-center gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-9 items-center border border-[var(--border)] bg-[var(--bg-card)] px-3.5 text-[13px] text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
