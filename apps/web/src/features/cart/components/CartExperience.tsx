"use client";

import React, { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatVnd } from "@repo/shared";
import { ActionButton } from "@/components/shared/ActionButton";
import { ActionLink } from "@/components/shared/ActionLink";
import { BackButton } from "@/components/shared/BackButton";
import { EmptyState, EmptyStateLinks } from "@/components/shared/EmptyState";
import { FEATURED_COLLECTION_IDS } from "@/lib/catalog";
import { UndoSnackbar } from "@/components/shared/UndoSnackbar";
import { useCart } from "../hooks/useCart";
import { CartItemList } from "./CartItemList";
import { CartPromoSection } from "./CartPromoSection";
import { CartSummary } from "./CartSummary";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Khung chờ khi giỏ đang nạp từ localStorage — tránh chớp trạng thái "trống" */
function CartSkeleton() {
  return (
    <div className="animate-pulse border-t border-[var(--border)]" aria-hidden="true">
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
  );
}

/**
 * Trang Giỏ hàng — cùng bố cục trang Yêu thích (tràn màn, 2 cột ngay từ đầu trang):
 * - Trái: mũi tên về Cửa hàng + eyebrow → tiêu đề + mô tả → thanh công cụ (số sản phẩm, xóa giỏ) → danh sách DÒNG
 *   (khác lưới thẻ của Yêu thích: mỗi sản phẩm một dòng ngang để sửa size / số lượng / xem số đo).
 * - Phải (desktop): tóm tắt đơn hàng ghim cố định, cao vừa màn hình — tổng tiền + nút thanh toán luôn hiện ở đáy.
 * - Mobile / tablet: tóm tắt nằm dưới danh sách và luôn có thanh tổng tiền + nút thanh toán cố định ở đáy màn hình.
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
  const tp = useTranslations("Product");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const hasItems = isLoaded && cartItems.length > 0;

  const summary = (
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
  );

  return (
    <MotionConfig reducedMotion="user">
      {/* Desktop: 2 cột ngay từ đầu trang — trái: tiêu đề + danh sách; phải: tóm tắt cao hết màn, ghim khi cuộn */}
      <div
        className={`font-[family-name:var(--font-lora)] text-[var(--text-main)] ${
          hasItems
            ? "pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:pb-0 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-12"
            : ""
        }`}
      >
        <div className="min-w-0">
          {/* Tiêu đề: mũi tên về Cửa hàng + eyebrow → tiêu đề + mô tả */}
          <header className="mb-8 sm:mb-10">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="flex items-center gap-2"
            >
              <BackButton href="/products" variant="inline" label={t("backToShop")} />
              <p className="text-[10px] uppercase tracking-[3px] text-[var(--text-light)] sm:text-[11px]">{t("eyebrow")}</p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
              className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl"
            >
              {t("title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
              className="mt-1.5 max-w-xl text-[13px] leading-6 text-[var(--text-light)]"
            >
              {t("subtitle")}
            </motion.p>
          </header>

          {!isLoaded ? (
            <CartSkeleton />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {cartItems.length === 0 ? (
                <EmptyState
                  key="empty"
                  icon={ShoppingBag}
                  eyebrow={t("empty.eyebrow")}
                  title={t("empty.title")}
                  description={t("empty.description")}
                  action={t("empty.action")}
                  secondaryAction={{ label: t("empty.secondary"), href: "/wishlist" }}
                >
                  <EmptyStateLinks
                    title={t("empty.suggestions")}
                    links={FEATURED_COLLECTION_IDS.map((id) => ({ label: tp(`collections.${id}`), href: `/products?category=${id}` }))}
                  />
                </EmptyState>
              ) : (
                <motion.section
                  key="cart"
                  aria-label={t("columns.product")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                  {/* Thanh công cụ: số sản phẩm + xóa giỏ (xác nhận tại chỗ) — cùng kiểu thanh công cụ trang Yêu thích */}
                  <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 pb-3">
                    <p className="text-[11px] uppercase tracking-[2px] text-[var(--text-light)] sm:text-xs">
                      {t("itemCount", { count: totals.totalQuantity })}
                    </p>
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
                          <ActionButton variant="cancel" size="sm" onClick={() => setConfirmingClear(false)}>
                            {t("actions.cancel")}
                          </ActionButton>
                          <ActionButton
                            variant="custom"
                            size="sm"
                            colors={{ bg: "var(--destructive)", text: "#FFFFFF", border: "var(--destructive)" }}
                            onClick={() => {
                              setConfirmingClear(false);
                              handleClearAll();
                            }}
                          >
                            {t("actions.confirmClear")}
                          </ActionButton>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="clear"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.25, ease: EASE }}
                        >
                          <ActionButton variant="cancel" size="sm" icon={<Trash2 strokeWidth={1.6} />} onClick={() => setConfirmingClear(true)}>
                            {t("actions.clearAll")}
                          </ActionButton>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <CartItemList
                    cartItems={cartItems}
                    locale={locale}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                  />

                  {/* Mobile / tablet: tóm tắt nằm dưới danh sách */}
                  <div className="mt-10 lg:hidden">{summary}</div>
                </motion.section>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Cột phải (desktop): tóm tắt ghim đúng vị trí ban đầu (header đo thật + --page-y), cao vừa màn hình */}
        {hasItems ? (
          <div className="hidden lg:block">
            <div className="sticky top-[calc(var(--site-header-h)+var(--page-y))] h-[calc(100svh-var(--site-header-h)-var(--page-y)-1rem)]">
              {summary}
            </div>
          </div>
        ) : null}

        {/* Thanh thanh toán cố định đáy màn hình (mobile / tablet) */}
        <AnimatePresence>
          {hasItems ? (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: EASE }}
              className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--bg-card)]/95 px-(--page-gutter) py-3 backdrop-blur lg:hidden"
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
