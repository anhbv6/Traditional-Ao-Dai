"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { QuantitySelector } from "@/components/shared/QuantitySelector";
import { useCartStore } from "../store/cartStore";
import { MAX_LINE_QUANTITY, getCartItemHref } from "../utils/pricing";
import { type CartItem } from "../types/cart.types";

const EASE = [0.22, 1, 0.36, 1] as const;

interface CartMiniItemProps {
  item: CartItem;
  locale: Locale;
  /** Gọi khi bấm link sang trang chi tiết (vd. đóng giỏ mini) */
  onNavigate?: () => void;
}

/**
 * Một dòng sản phẩm dạng gọn — dùng chung cho giỏ mini ở header và khung giỏ hàng trang Yêu thích.
 * Ảnh · tên · phân loại · QuantitySelector (cỡ sm) chỉnh tại chỗ · thành tiền · nút xoá hiện khi rê chuột.
 * Đặt trong <ul> và bọc AnimatePresence để có hiệu ứng vào / ra.
 */
export function CartMiniItem({ item, locale, onNavigate }: CartMiniItemProps) {
  const t = useTranslations('CartPage');
  const { updateQuantity, removeItem } = useCartStore.getState();
  const lineTotal = item.price * item.quantity;
  const variant = [item.color, `${t('item.size')} ${item.size}`, item.measurements ? t('item.custom') : null].filter(Boolean).join(' · ');

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="group relative flex gap-3.5 overflow-hidden border-b border-[var(--border)] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[var(--bg-main)]"
    >
      <Link
        href={getCartItemHref(item)}
        onClick={onNavigate}
        className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-[var(--bg-secondary)]"
      >
        <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover object-top" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <Link
            href={getCartItemHref(item)}
            onClick={onNavigate}
            className="line-clamp-1 flex-1 font-[family-name:var(--font-playfair)] text-[14px] font-semibold leading-snug transition-colors hover:text-[var(--primary-ink)]"
          >
            {item.name}
          </Link>
          {/* Xoá: hiện khi rê chuột vào dòng (luôn hiện khi focus bằng phím) */}
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            aria-label={t('item.remove')}
            title={t('item.remove')}
            className="-mr-1 -mt-0.5 grid size-6 shrink-0 cursor-pointer place-items-center text-[var(--text-light)]/70 opacity-0 transition-[opacity,color] hover:text-[var(--destructive)] focus-visible:opacity-100 group-hover:opacity-100"
          >
            <X size={13} />
          </button>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-[var(--text-light)]">{variant}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {/* Ô số lượng dùng chung (cùng kiểu trang chi tiết, cỡ nhỏ) */}
          <QuantitySelector
            size="sm"
            value={item.quantity}
            onChange={(quantity) => updateQuantity(item.id, quantity)}
            max={MAX_LINE_QUANTITY}
            background="var(--bg-card)"
            labels={{ decrease: t('item.decrease'), increase: t('item.increase') }}
          />

          <div className="text-right leading-tight [font-variant-numeric:lining-nums]">
            <p className="text-[13px] font-semibold text-[var(--primary-ink)]">{formatVnd(lineTotal, locale)}</p>
            {item.quantity > 1 ? (
              <p className="mt-0.5 text-[10px] text-[var(--text-light)]">{t('mini.each', { price: formatVnd(item.price, locale) })}</p>
            ) : null}
          </div>
        </div>
      </div>
    </motion.li>
  );
}
