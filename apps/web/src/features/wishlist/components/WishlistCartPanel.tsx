"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { formatVnd, type Locale } from "@repo/shared";
import { useTranslations } from "next-intl";
import { CartMiniItem, calculateCartTotals, useCartHydrated, useCartStore } from "@/features/cart";
import { ActionLink } from "@/components/shared/ActionLink";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface WishlistCartPanelProps {
  /** Ref vùng thả — thẻ đang kéo đo vị trí con trỏ với khung này */
  dropRef: React.Ref<HTMLElement>;
  locale: Locale;
  /** Đang kéo một thẻ (vùng thả nổi bật lên) */
  isDragging: boolean;
  /** Con trỏ đang nằm trên vùng thả */
  isOver: boolean;
  /** Tăng mỗi lần thả thành công → viền khung giỏ loé lên xác nhận */
  addedSignal: number;
}

/**
 * Khung giỏ hàng bên phải trang Yêu thích (desktop), ghim theo khi cuộn — vừa là VÙNG THẢ vừa là giỏ mini:
 * - Kéo thẻ từ danh sách bên trái vào đây để thêm vào giỏ; khi kéo, khung viền nét đứt sáng lên, rê vào thì đậm hơn.
 * - Danh sách dòng dùng chung `CartMiniItem` (cùng giỏ mini header): chỉnh số lượng / xoá ngay tại chỗ.
 * - Chân khung: tạm tính + nút Thanh toán (ActionLink) + link Xem giỏ hàng.
 */
export function WishlistCartPanel({ dropRef, locale, isDragging, isOver, addedSignal }: WishlistCartPanelProps) {
  const t = useTranslations("WishlistPage.cartPanel");
  const tc = useTranslations("CartPage");
  const cartItems = useCartStore((state) => state.items);
  const cartReady = useCartHydrated();
  const { subtotal, totalQuantity } = calculateCartTotals(cartItems);

  return (
    <motion.aside
      ref={dropRef}
      aria-label={t("title")}
      className={cn(
        "relative flex h-full flex-col border bg-[var(--bg-card)] transition-[border-color,box-shadow] duration-300",
        isOver
          ? "border-[var(--primary-color)] shadow-[0_18px_40px_-20px_rgba(128,0,32,0.45)]"
          : isDragging
            ? "border-[var(--primary-color)]/50"
            : "border-[var(--border)]",
      )}
    >
      {/* Thả thành công: viền đỏ đô loé lên rồi tắt (key đổi -> chạy lại hiệu ứng) */}
      {addedSignal > 0 ? (
        <motion.span
          key={addedSignal}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px border-2 border-[var(--primary-color)]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      ) : null}

      {/* Tiêu đề + số lượng */}
      <header className="flex shrink-0 items-center gap-2 px-5 pb-3 pt-4">
        <ShoppingBag size={17} strokeWidth={1.5} className="text-[var(--primary-ink)]" />
        <h2 className="font-[family-name:var(--font-playfair)] text-[17px] font-semibold text-[var(--primary-ink)]">{t("title")}</h2>
        {cartReady && totalQuantity > 0 ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--primary-color)] px-1.5 text-[10px] font-bold text-white [font-variant-numeric:lining-nums]">
            {totalQuantity}
          </span>
        ) : null}
      </header>

      {/* Vùng thả: nét đứt, sáng lên khi đang kéo */}
      <div className="shrink-0 px-5">
        <div
          className={cn(
            "flex flex-col items-center gap-1.5 border border-dashed px-4 py-5 text-center transition-colors duration-300",
            isOver
              ? "border-[var(--primary-color)] bg-[var(--primary-color)]/8 text-[var(--primary-ink)]"
              : isDragging
                ? "border-[var(--primary-color)]/60 bg-[var(--primary-color)]/4 text-[var(--primary-ink)]"
                : "border-[var(--border)] text-[var(--text-light)]",
          )}
        >
          <motion.span animate={isOver ? { y: [0, 4, 0] } : { y: 0 }} transition={{ duration: 0.8, repeat: isOver ? Infinity : 0 }}>
            <ShoppingBag size={20} strokeWidth={1.3} />
          </motion.span>
          <p className="text-xs leading-5">{isOver ? t("release") : t("hint")}</p>
        </div>
      </div>

      {/* Danh sách: cuộn riêng, không kéo theo trang (data-lenis-prevent) */}
      {cartReady && cartItems.length > 0 ? (
        <>
          <ul data-lenis-prevent className="scrollbar-brand mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain border-y border-[var(--border)]">
            <AnimatePresence initial={false}>
              {cartItems.map((item) => (
                <CartMiniItem key={item.id} item={item} locale={locale} />
              ))}
            </AnimatePresence>
          </ul>

          {/* Chân khung luôn hiện ở đáy (không cuộn theo danh sách) */}
          <div className="shrink-0 px-5 pb-5 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-[var(--text-light)]">{tc("mini.subtotal", { count: totalQuantity })}</span>
              <span className="font-[family-name:var(--font-playfair)] text-[19px] font-semibold text-[var(--primary-ink)] [font-variant-numeric:lining-nums]">
                {formatVnd(subtotal, locale)}
              </span>
            </div>
            <ActionLink href="/checkout" fullWidth className="mt-4" icon={<ArrowRight />} iconPosition="end">
              {tc("mini.checkout")}
            </ActionLink>
            <Link
              href="/cart"
              className="mx-auto mt-3 block w-fit border-b border-[var(--primary-color)]/30 pb-0.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
            >
              {tc("mini.viewCart")}
            </Link>
          </div>
        </>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="px-5 pb-6 pt-4 text-center text-[13px] text-[var(--text-light)]"
        >
          {t("empty")}
        </motion.p>
      )}
    </motion.aside>
  );
}
