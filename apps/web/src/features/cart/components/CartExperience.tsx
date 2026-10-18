"use client";

import React, { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { formatVnd } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { ActionLink } from "@/components/shared/ActionLink";
import { BackButton } from "@/components/shared/BackButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { UndoSnackbar } from "@/components/shared/UndoSnackbar";
import { useCart } from "../hooks/useCart";
import { CartItemList } from "./CartItemList";
import { CartPromoSection } from "./CartPromoSection";
import { CartSummary } from "./CartSummary";

const EASE = [0.22, 1, 0.36, 1] as const;
const LAYOUT_CLASS = "grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-16";

/** Khung chờ khi giỏ đang nạp từ localStorage — tránh chớp trạng thái "trống" */
function CartSkeleton() {
  return (
    <div className={`animate-pulse ${LAYOUT_CLASS}`} aria-hidden="true">
      <div className="border-t border-[var(--border)]">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex gap-5 border-b border-[var(--border)] py-6">
            <div className="aspect-[3/4] w-24 bg-[var(--bg-secondary)] sm:w-28" />
            <div className="flex-1 space-y-2.5 pt-1">
              <div className="h-3.5 w-2/3 bg-[var(--bg-secondary)]" />
              <div className="h-3 w-1/3 bg-[var(--bg-secondary)]" />
              <div className="h-3 w-1/4 bg-[var(--bg-secondary)]" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-96 bg-[var(--bg-secondary)]" />
    </div>
  );
}

/**
 * Trang Giỏ hàng — luồng chuẩn: xem lại sản phẩm (sửa số lượng / xóa có hoàn tác) → mã giảm giá → tổng tiền → thanh toán.
 * Desktop: danh sách bên trái, tóm tắt dính bên phải. Mobile / tablet: tóm tắt nằm dưới danh sách
 * và luôn có thanh tổng tiền + nút thanh toán cố định ở đáy màn hình.
 */
export function CartExperience() {
  const {
    t,
    locale,
    isLoaded,
    cartItems,
    totals,
    hasCustomItems,
    promoCode,
    setPromoCode,
    promoError,
    activeDiscount,
    promoDescription,
    handleApplyPromo,
    handleRemovePromo,
    handleQuantityChange,
    handleRemoveItem,
    handleClearAll,
    lastRemoved,
    handleUndo,
    dismissUndo,
  } = useCart();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const hasItems = isLoaded && cartItems.length > 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className={`font-[family-name:var(--font-lora)] text-[var(--text-main)] ${hasItems ? "pb-20 lg:pb-0" : ""}`}>
        {/* Đầu trang: quay lại / tiếp tục mua sắm — tiêu đề + số sản phẩm */}
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between gap-4">
            <BackButton fallbackHref="/products" />
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[2px] text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)] sm:text-[11px]"
            >
              {t("continueShopping")}
              <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:mt-8">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="m-0 font-[family-name:var(--font-playfair)] text-[1.75rem] font-semibold leading-tight text-[var(--text-main)] sm:text-[2.25rem] 2xl:text-[2.5rem]"
            >
              {t("title")}
            </motion.h1>
            {hasItems ? (
              <span className="text-xs uppercase tracking-[2px] text-[var(--text-light)]">{t("itemCount", { count: totals.totalQuantity })}</span>
            ) : null}
          </div>
        </header>

        {!isLoaded ? (
          <CartSkeleton />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {cartItems.length === 0 ? (
              <EmptyState
                key="empty"
                icon={ShoppingBag}
                title={t("empty.title")}
                description={t("empty.description")}
                action={t("empty.action")}
              />
            ) : (
              <motion.div
                key="cart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                className={LAYOUT_CLASS}
              >
                <section aria-label={t("columns.product")}>
                  <CartItemList
                    cartItems={cartItems}
                    locale={locale}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                  />

                  {/* Xóa toàn bộ giỏ: xác nhận tại chỗ */}
                  <div className="mt-4 flex min-h-9 items-center justify-end">
                    <AnimatePresence mode="wait" initial={false}>
                      {confirmingClear ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.25, ease: EASE }}
                          className="flex items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => setConfirmingClear(false)}
                            className="min-h-8 cursor-pointer border border-[var(--border)] px-3 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:border-[var(--text-main)] hover:text-[var(--text-main)]"
                          >
                            {t("actions.cancel")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmingClear(false);
                              handleClearAll();
                            }}
                            className="min-h-8 cursor-pointer bg-[var(--destructive)] px-3 text-[10px] font-semibold uppercase tracking-[1.5px] text-white transition-opacity hover:opacity-90"
                          >
                            {t("actions.confirmClear")}
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="clear"
                          type="button"
                          onClick={() => setConfirmingClear(true)}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.25, ease: EASE }}
                          className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:text-[var(--destructive)]"
                        >
                          <Trash2 size={12} strokeWidth={1.6} />
                          {t("actions.clearAll")}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </section>

                {/* Tóm tắt (dính khi cuộn trên desktop) */}
                <aside className="lg:sticky lg:top-24">
                  <CartSummary
                    totals={totals}
                    activeDiscount={activeDiscount}
                    locale={locale}
                    hasCustomItems={hasCustomItems}
                    promoSlot={
                      <CartPromoSection
                        promoCode={promoCode}
                        setPromoCode={setPromoCode}
                        handleApplyPromo={handleApplyPromo}
                        handleRemovePromo={handleRemovePromo}
                        promoError={promoError}
                        activeDiscount={activeDiscount}
                        promoDescription={promoDescription}
                      />
                    }
                  />
                </aside>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Thanh thanh toán cố định đáy màn hình (mobile / tablet) */}
        <AnimatePresence>
          {hasItems ? (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: EASE }}
              className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--bg-card)]/95 px-5 py-3 backdrop-blur sm:px-8 lg:hidden"
            >
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[2px] text-[var(--text-light)]">{t("summary.mobileTotal")}</p>
                  <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold tabular-nums text-[var(--primary-ink)]">
                    {formatVnd(totals.total, locale)}
                  </p>
                </div>
                <ActionLink href="/checkout" variant="confirm" size="md" icon={<ArrowRight />} iconPosition="end" className="shrink-0">
                  {t("mini.checkout")}
                </ActionLink>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <UndoSnackbar
          activeKey={lastRemoved?.item.id ?? null}
          message={lastRemoved ? t("undo.removed", { name: lastRemoved.item.name }) : ""}
          undoLabel={t("actions.undo")}
          closeLabel={t("actions.close")}
          onUndo={handleUndo}
          onDismiss={dismissUndo}
        />
      </div>
    </MotionConfig>
  );
}
export default CartExperience;
