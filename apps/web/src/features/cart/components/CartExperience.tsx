"use client";

import React, { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { EmptyState } from "@/components/shared/EmptyState";
import { UndoSnackbar } from "@/components/shared/UndoSnackbar";
import { useCart } from "../hooks/useCart";
import { CartFreeShippingBar } from "./CartFreeShippingBar";
import { CartItemList } from "./CartItemList";
import { CartPromoSection } from "./CartPromoSection";
import { CartSummary } from "./CartSummary";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Khung chờ khi giỏ đang nạp từ localStorage — tránh chớp trạng thái "trống" */
function CartSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,1fr)_340px]" aria-hidden="true">
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex gap-4 border-b border-[var(--border)] pb-4">
            <div className="aspect-[3/4] w-20 bg-[var(--bg-secondary)]" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-2/3 bg-[var(--bg-secondary)]" />
              <div className="h-3 w-1/3 bg-[var(--bg-secondary)]" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-72 bg-[var(--bg-secondary)]" />
    </div>
  );
}

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

  return (
    <MotionConfig reducedMotion="user">
      <div className="font-[family-name:var(--font-lora)] text-[var(--text-main)]">
        {/* Tiêu đề */}
        <header className="mb-6 sm:mb-8">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[2px] text-[var(--text-light)] transition-colors hover:text-[var(--primary-color)] sm:text-[11px]"
          >
            <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
            {t("continueShopping")}
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="text-2xl font-semibold leading-tight sm:text-3xl"
            >
              {t("title")}
            </motion.h1>
            {isLoaded && cartItems.length > 0 ? (
              <span className="text-[11px] uppercase tracking-[1.5px] text-[var(--text-light)] sm:text-xs">
                {t("itemCount", { count: totals.totalQuantity })}
              </span>
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
                className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10"
              >
                {/* Cột trái: miễn phí vận chuyển + danh sách */}
                <section aria-label={t("columns.product")}>
                  <div className="mb-5 border border-[var(--border)] bg-white px-4 py-3">
                    <CartFreeShippingBar
                      subtotal={totals.subtotal}
                      threshold={totals.freeShippingThreshold}
                      remaining={totals.freeShippingRemaining}
                      locale={locale}
                    />
                  </div>

                  <CartItemList
                    cartItems={cartItems}
                    locale={locale}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                  />

                  {/* Xóa toàn bộ giỏ: xác nhận tại chỗ */}
                  <div className="mt-4 flex justify-end">
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
                          className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:text-[var(--destructive)]"
                        >
                          <Trash2 size={12} strokeWidth={1.6} />
                          {t("actions.clearAll")}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </section>

                {/* Cột phải: tóm tắt (dính khi cuộn trên desktop) */}
                <aside className="lg:sticky lg:top-28">
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
