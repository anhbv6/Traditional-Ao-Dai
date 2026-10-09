'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatVnd, type Locale } from '@repo/shared';
import { CartFreeShippingBar, calculateCartTotals, useCartStore } from '@/features/cart';
import { Link, usePathname } from '@/i18n/routing';

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
 * Nút giỏ hàng ở header. Bấm luôn sang trang giỏ hàng; desktop rê chuột / focus bàn phím mở bảng xem nhanh
 * (danh sách, tiến trình miễn phí vận chuyển, tạm tính). Số trên huy hiệu "nảy" mỗi khi thay đổi.
 */
export function CartButton({ label = 'Cart', preview = false }: CartButtonProps) {
  const t = useTranslations('CartPage');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const { subtotal, totalQuantity, freeShippingThreshold } = calculateCartTotals(cartItems);
  // Tiến trình freeship ở xem nhanh không xét mã giảm giá (mã chỉ hiện ở trang giỏ)
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);

  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canPreview = preview && !NO_PREVIEW_PATHS.includes(pathname);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const schedule = (open: boolean) => {
    if (!canPreview) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsOpen(open), open ? OPEN_DELAY : CLOSE_DELAY);
  };

  const close = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => schedule(true)}
      onMouseLeave={() => schedule(false)}
      onFocus={() => schedule(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) schedule(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <Link
        href="/cart"
        data-cart-target
        aria-label={totalQuantity > 0 ? `${label} (${totalQuantity})` : label}
        aria-expanded={canPreview ? isOpen : undefined}
        onClick={close}
        className="relative grid h-11 w-11 place-items-center text-primary transition-opacity hover:opacity-75"
      >
        <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
        <AnimatePresence initial={false}>
          {totalQuantity > 0 ? (
            <motion.span
              key={totalQuantity}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0, position: 'absolute' }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}
              className="absolute right-1 top-1.5 grid h-4 min-w-4 place-items-center bg-primary px-1 text-[10px] font-bold leading-none text-white"
            >
              {totalQuantity > 99 ? '99+' : totalQuantity}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </Link>

      <AnimatePresence>
        {canPreview && isOpen ? (
          <motion.div
            role="dialog"
            aria-label={t('mini.title')}
            initial={{ opacity: 0, y: 8, clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute right-0 top-full z-50 mt-2 w-[340px] border border-[var(--border)] border-t-2 border-t-[var(--primary-color)] bg-white font-[family-name:var(--font-lora)] text-[var(--text-main)] shadow-[0_18px_40px_-12px_rgba(42,37,37,0.25)]"
          >
            <div className="flex items-baseline justify-between border-b border-[var(--border)] px-4 py-3">
              <p className="font-[family-name:var(--font-playfair)] text-[15px] font-semibold">{t('mini.title')}</p>
              {totalQuantity > 0 ? (
                <p className="text-[10px] uppercase tracking-[1.5px] text-[var(--text-light)]">
                  {t('itemCount', { count: totalQuantity })}
                </p>
              ) : null}
            </div>

            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <ShoppingBag size={26} strokeWidth={1.2} className="text-[var(--primary-color)]/50" />
                <p className="mt-3 text-[12px] text-[var(--text-light)]">{t('mini.empty')}</p>
                <Link
                  href="/products"
                  onClick={close}
                  className="mt-4 inline-flex min-h-9 items-center bg-[var(--primary-color)] px-5 text-[10px] font-semibold uppercase tracking-[2px] text-white transition-colors hover:bg-[#2A0A12]"
                >
                  {t('mini.shopNow')}
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <CartFreeShippingBar
                    subtotal={subtotal}
                    threshold={freeShippingThreshold}
                    remaining={freeShippingRemaining}
                    locale={locale}
                    compact
                  />
                </div>

                {/* data-lenis-prevent: cuộn danh sách không kéo theo smooth-scroll của trang */}
                <ul data-lenis-prevent className="max-h-[280px] overflow-y-auto overscroll-contain px-4">
                  <AnimatePresence initial={false}>
                    {cartItems.map((item, index) => (
                      <motion.li
                        key={item.id}
                        layout="position"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ duration: 0.35, ease: EASE, delay: isOpen ? Math.min(index, 5) * 0.04 : 0 }}
                        className="group flex gap-3 overflow-hidden border-b border-[var(--border)] py-3 last:border-b-0"
                      >
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={close}
                          className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden bg-[var(--bg-secondary)]"
                        >
                          <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={close}
                            className="line-clamp-1 font-[family-name:var(--font-playfair)] text-[13px] font-semibold transition-colors hover:text-[var(--primary-color)]"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-0.5 truncate text-[10px] text-[var(--text-light)]">
                            {[item.color, `${t('item.size')} ${item.size}`, item.measurements ? t('item.custom') : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--text-main)]">
                            {t('mini.quantityPrice', { quantity: item.quantity, price: formatVnd(item.price, locale) })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => useCartStore.getState().removeItem(item.id)}
                          aria-label={t('item.remove')}
                          title={t('item.remove')}
                          className="grid size-7 shrink-0 cursor-pointer place-items-center self-start text-[var(--text-light)]/60 opacity-0 transition-[opacity,color] hover:text-[var(--destructive)] focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <X size={13} />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="border-t border-[var(--border)] bg-[var(--bg-main)] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-light)]">{t('summary.subtotal')}</span>
                    <span className="text-[15px] font-semibold text-[var(--primary-color)]">{formatVnd(subtotal, locale)}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-[var(--text-light)]">{t('mini.note')}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href="/cart"
                      onClick={close}
                      className="flex min-h-9 items-center justify-center border border-[var(--text-main)]/20 bg-white text-[10px] font-semibold uppercase tracking-[1.5px] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                    >
                      {t('mini.viewCart')}
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={close}
                      className="flex min-h-9 items-center justify-center bg-[var(--primary-color)] text-[10px] font-semibold uppercase tracking-[1.5px] text-white transition-colors hover:bg-[#2A0A12]"
                    >
                      {t('mini.checkout')}
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
