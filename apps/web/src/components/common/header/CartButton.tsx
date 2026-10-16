'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ShoppingBag, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatVnd, type Locale } from '@repo/shared';
import { MAX_LINE_QUANTITY, calculateCartTotals, useCartHydrated, useCartStore, type CartItem } from '@/features/cart';
import { Link, usePathname } from '@/i18n/routing';
import { ActionLink } from '@/components/shared/ActionLink';
import { QuantitySelector } from '@/components/shared/QuantitySelector';
import { AppPopover, AppPopoverTitle } from '@/components/shared/AppPopover';
import { CountBadge } from './CountBadge';

type CartButtonProps = {
  label?: string;
  /** Bật bảng xem nhanh khi rê chuột (chỉ desktop — thiết bị cảm ứng bấm thẳng vào trang giỏ) */
  preview?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const OPEN_DELAY = 80;
const CLOSE_DELAY = 180;
/** Ở chính trang giỏ / thanh toán thì xem nhanh là thừa -> chỉ còn link */
const NO_PREVIEW_PATHS = ['/cart', '/checkout'];

/**
 * Nút giỏ hàng ở header. Bấm luôn sang trang giỏ hàng; desktop rê chuột / focus mở GIỎ MINI (AppPopover).
 *
 * Giỏ mini tập trung vào việc "xem nhanh – chỉnh nhanh – thanh toán":
 * - Mỗi dòng: ảnh · tên · phân loại · QuantitySelector chung (cỡ sm) chỉnh ngay tại chỗ · thành tiền căn phải · nút xoá khi rê chuột.
 * - Footer: tạm tính nổi bật + MỘT nút chính "Thanh toán" (kèm tổng tiền) + link phụ "Xem giỏ hàng".
 * - Không hiện phí vận chuyển / mã giảm giá (tính ở trang giỏ) để bảng gọn.
 * Huy hiệu số lượng dùng chung CountBadge (đổi số trượt + "+1 / −1").
 */
export function CartButton({ label = 'Cart', preview = false }: CartButtonProps) {
  const t = useTranslations('CartPage');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const cartReady = useCartHydrated();
  const { subtotal, totalQuantity } = calculateCartTotals(cartItems);

  const [isOpen, setIsOpen] = useState(false);
  const canPreview = preview && !NO_PREVIEW_PATHS.includes(pathname);
  const close = () => setIsOpen(false);

  return (
    <AppPopover
      disabled={!canPreview}
      open={isOpen}
      onOpenChange={setIsOpen}
      openOnHover
      delay={OPEN_DELAY}
      closeDelay={CLOSE_DELAY}
      width={360}
      showArrow={false}
      trigger={
        <Link
          href="/cart"
          data-cart-target
          aria-label={totalQuantity > 0 ? `${label} (${totalQuantity})` : label}
          onClick={close}
          className="relative grid h-11 w-11 place-items-center text-primary-ink transition-opacity hover:opacity-75"
        >
          <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
          <CountBadge count={totalQuantity} ready={cartReady} />
        </Link>
      }
      header={
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <AppPopoverTitle className="flex items-center gap-2 font-[family-name:var(--font-playfair)] text-[17px] font-semibold text-[var(--primary-ink)]">
            {t('mini.title')}
            {totalQuantity > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--primary-color)] px-1.5 font-[family-name:var(--font-lora)] text-[10px] font-bold text-white [font-variant-numeric:lining-nums]">
                {totalQuantity}
              </span>
            ) : null}
          </AppPopoverTitle>
        </div>
      }
    >
      {cartItems.length === 0 ? (
        /* ---------- Giỏ trống ---------- */
        <div className="flex flex-col items-center px-6 pb-7 pt-3 text-center">
          <span className="relative grid size-14 place-items-center text-[var(--primary-ink)]">
            <span aria-hidden="true" className="absolute inset-2 rotate-45 border border-[var(--primary-color)]/30" />
            <ShoppingBag size={20} strokeWidth={1.4} className="relative" />
          </span>
          <p className="mt-3 text-[13px] text-[var(--text-light)]">{t('mini.empty')}</p>
          <ActionLink href="/products" onClick={close} size="sm" className="mt-5" icon={<ArrowRight />} iconPosition="end">
            {t('mini.shopNow')}
          </ActionLink>
        </div>
      ) : (
        <>
          {/* ---------- Danh sách: cuộn riêng, không kéo theo trang (data-lenis-prevent) ---------- */}
          <ul data-lenis-prevent className="scrollbar-brand max-h-[320px] overflow-y-auto overscroll-contain border-y border-[var(--border)]">
            <AnimatePresence initial={false}>
              {cartItems.map((item) => (
                <MiniCartRow key={item.id} item={item} locale={locale} onNavigate={close} />
              ))}
            </AnimatePresence>
          </ul>

          {/* ---------- Tạm tính + hành động ---------- */}
          <div className="px-5 pb-5 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-[var(--text-light)]">{t('mini.subtotal', { count: totalQuantity })}</span>
              <span className="font-[family-name:var(--font-playfair)] text-[19px] font-semibold text-[var(--primary-ink)] [font-variant-numeric:lining-nums]">
                {formatVnd(subtotal, locale)}
              </span>
            </div>
            <ActionLink href="/checkout" onClick={close} fullWidth className="mt-4" icon={<ArrowRight />} iconPosition="end">
              {t('mini.checkout')}
            </ActionLink>
            <Link
              href="/cart"
              onClick={close}
              className="mx-auto mt-3 block w-fit border-b border-[var(--primary-color)]/30 pb-0.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
            >
              {t('mini.viewCart')}
            </Link>
          </div>
        </>
      )}
    </AppPopover>
  );
}

/* ============================================================================
 * MỘT DÒNG SẢN PHẨM TRONG GIỎ MINI
 * ========================================================================== */

function MiniCartRow({ item, locale, onNavigate }: { item: CartItem; locale: Locale; onNavigate: () => void }) {
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
        href={`/products/${item.slug}`}
        onClick={onNavigate}
        className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-[var(--bg-secondary)]"
      >
        <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover object-top" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <Link
            href={`/products/${item.slug}`}
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
