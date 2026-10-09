"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Scissors, ShoppingBag, X } from "lucide-react";
import { formatVnd, type Locale } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { type WishlistItem } from "../types/wishlist.types";

const EASE = [0.22, 1, 0.36, 1] as const;
const FALLBACK_IMAGE = "/logoPage.png";

interface WishlistCardProps {
  item: WishlistItem;
  index: number;
  locale: Locale;
  labels: { remove: string; addToCart: string; customTailor: string; custom: string; sale: string };
  onRemove: (item: WishlistItem) => void;
  onPrimaryAction: (item: WishlistItem) => void;
  /** AnimatePresence `popLayout` cần ref tới phần tử gốc để đo vị trí khi thẻ rời đi */
  ref?: React.Ref<HTMLElement>;
}

/**
 * Thẻ sản phẩm yêu thích — cùng ngôn ngữ thiết kế với ProductCard (vuông góc, ảnh dọc, chữ tối giản).
 * Vào: ảnh hé lộ như kéo màn từ dưới lên, lần lượt theo vị trí. Ra: mờ + thu nhỏ, các thẻ còn lại trượt về chỗ (layout).
 */
export function WishlistCard({ item, index, locale, labels, onRemove, onPrimaryAction, ref }: WishlistCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const href = `/products/${item.slug}`;
  const isCustom = item.purchaseType === "custom";
  const delay = Math.min(index, 7) * 0.06;

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.3, ease: EASE } }}
      transition={{
        layout: { type: "spring", stiffness: 280, damping: 34 },
        opacity: { duration: 0.5, delay },
        y: { duration: 0.7, delay, ease: EASE },
      }}
      className="group flex flex-col font-[family-name:var(--font-lora)] text-[var(--text-main)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--bg-secondary)]">
        {/* Tấm màn hé lộ ảnh */}
        <motion.div
          className="absolute inset-0"
          initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 1.1, delay, ease: EASE }}
        >
          <Link href={href} aria-label={item.name} className="absolute inset-0 block">
            <Image
              src={imageFailed ? FALLBACK_IMAGE : item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] ${
                imageFailed ? "object-contain px-8 py-10" : "object-cover"
              }`}
              onError={() => setImageFailed(true)}
            />
          </Link>
        </motion.div>

        {/* Nhãn */}
        <div className="pointer-events-none absolute left-0 top-2.5 flex flex-col items-start gap-1">
          {item.originalPrice ? (
            <span className="bg-[var(--primary-color)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.5px] text-white sm:text-[10px]">
              {labels.sale}
            </span>
          ) : null}
          {isCustom ? (
            <span className="bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--primary-color)] backdrop-blur-sm sm:text-[10px]">
              {labels.custom}
            </span>
          ) : null}
        </div>

        {/* Bỏ khỏi yêu thích: luôn hiện trên mobile, rê chuột mới hiện trên desktop */}
        <button
          type="button"
          onClick={() => onRemove(item)}
          aria-label={labels.remove}
          title={labels.remove}
          className="absolute right-2 top-2 grid size-7 cursor-pointer place-items-center bg-white/90 text-[var(--text-main)] backdrop-blur-sm transition-[opacity,background-color,color,transform] duration-300 hover:bg-[var(--primary-color)] hover:text-white focus-visible:opacity-100 active:scale-90 sm:size-8 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <X size={14} strokeWidth={1.6} className="transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <h3 className="min-w-0 text-[13px] leading-snug sm:text-[15px]">
          <Link
            href={href}
            title={item.name}
            className="block truncate font-[family-name:var(--font-playfair)] font-semibold text-[var(--text-main)] transition-colors hover:text-[var(--primary-color)]"
          >
            {item.name}
          </Link>
        </h3>
        {item.subline ? (
          <p className="mt-0.5 truncate text-[11px] text-[var(--text-light)] sm:text-xs">{item.subline}</p>
        ) : null}
        <p className="mt-1.5 flex items-baseline gap-x-1.5 whitespace-nowrap text-[12px] sm:text-[14px]">
          <span className="font-semibold text-[var(--primary-color)]">{formatVnd(item.price, locale)}</span>
          {item.originalPrice ? (
            <span className="text-[10px] text-[var(--text-light)]/70 line-through sm:text-[11px]">
              {formatVnd(item.originalPrice, locale)}
            </span>
          ) : null}
        </p>

        {/* Nút chính: nền đỏ đô quét từ trái sang khi rê chuột */}
        <button
          type="button"
          onClick={() => onPrimaryAction(item)}
          className="group/btn relative mt-3 flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 overflow-hidden border border-[var(--primary-color)]/30 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--primary-color)] transition-colors duration-500 hover:border-[var(--primary-color)] hover:text-white active:scale-[0.98] sm:min-h-10 sm:text-[11px] sm:tracking-[2px]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 origin-left scale-x-0 bg-[var(--primary-color)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:scale-x-100"
          />
          <span className="relative flex items-center gap-1.5">
            {isCustom ? <Scissors size={13} strokeWidth={1.6} /> : <ShoppingBag size={13} strokeWidth={1.6} />}
            {isCustom ? labels.customTailor : labels.addToCart}
          </span>
        </button>
      </div>
    </motion.article>
  );
}
