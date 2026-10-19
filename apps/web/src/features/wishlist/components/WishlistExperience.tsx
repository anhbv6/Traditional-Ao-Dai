"use client";

import React, { useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Hand, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWishlist } from "../hooks/useWishlist";
import { BackButton } from "@/components/shared/BackButton";
import { EmptyState, EmptyStateLinks } from "@/components/shared/EmptyState";
import { FEATURED_COLLECTION_IDS } from "@/lib/catalog";
import { WishlistToolbar } from "./WishlistToolbar";
import { WishlistCartPanel } from "./WishlistCartPanel";
import { DraggableWishlistCard } from "./DraggableWishlistCard";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Trang tràn màn, thẻ gọn: số cột tăng theo bề rộng (cột trái đã trừ chỗ cho khung giỏ hàng bên phải) */
const GRID_CLASS =
  "grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:gap-x-5 lg:gap-y-8 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6";

/** Kéo thả chỉ bật trên desktop có chuột: màn cảm ứng kéo thẻ sẽ chặn cuộn trang, và khung giỏ chỉ hiện từ lg */
const DRAG_QUERY = "(min-width: 1024px) and (pointer: fine)";
const subscribeDragQuery = (onChange: () => void) => {
  const query = window.matchMedia(DRAG_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getCanDrag = () => window.matchMedia(DRAG_QUERY).matches;
const getCanDragOnServer = () => false;

/** Khung chờ khi đang nạp từ localStorage — tránh chớp trạng thái "trống" */
function WishlistSkeleton() {
  return (
    <div className={GRID_CLASS} aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4] bg-[var(--bg-secondary)]" />
          <div className="mt-3 h-3 w-3/4 bg-[var(--bg-secondary)]" />
          <div className="mt-2 h-3 w-1/3 bg-[var(--bg-secondary)]" />
        </div>
      ))}
    </div>
  );
}

/**
 * Trang Yêu thích:
 * - Tiêu đề: mũi tên về Cửa hàng + eyebrow → tiêu đề + mô tả.
 * - Desktop: bên trái là tiêu đề + các thẻ đã thích (ProductCard dùng chung, bấm tim để bỏ), bên phải là khung giỏ hàng
 *   bắt đầu ngang tiêu đề, cao hết màn hình và ghim khi cuộn.
 *   Kéo thẻ thả vào khung giỏ để thêm vào giỏ (hàng may đo được nhắc nhập số đo ở trang chi tiết).
 * - Mobile / tablet: chỉ có lưới thẻ — thêm vào giỏ bằng nút trên thẻ.
 */
export function WishlistExperience() {
  const { t, locale, isLoaded, items, readyCount, sortKey, setSortKey, handleClearAll, handleDropToCart, handleAddAllToCart } =
    useWishlist();

  const tp = useTranslations("Product");
  const hasItems = isLoaded && items.length > 0;
  const canDrag = useSyncExternalStore(subscribeDragQuery, getCanDrag, getCanDragOnServer);
  const dropRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [addedSignal, setAddedSignal] = useState(0);

  const handleDrop: typeof handleDropToCart = (item) => {
    const added = handleDropToCart(item);
    if (added) setAddedSignal((value) => value + 1);
    return added;
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Desktop: 2 cột ngay từ đầu trang — trái: tiêu đề + danh sách; phải: khung giỏ hàng cao hết màn, ghim khi cuộn */}
      {/* Danh sách trống: bỏ cột giỏ hàng, trạng thái trống căn giữa toàn trang */}
      <div
        className={`font-[family-name:var(--font-lora)] text-[var(--text-main)] ${
          hasItems ? "lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-12" : ""
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
            <WishlistSkeleton />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {items.length === 0 ? (
                <EmptyState
                  key="empty"
                  icon={Heart}
                  eyebrow={t("empty.eyebrow")}
                  title={t("empty.title")}
                  description={t("empty.description")}
                  action={t("empty.action")}
                  secondaryAction={{ label: t("empty.secondary"), href: "/custom" }}
                >
                  <EmptyStateLinks
                    title={t("empty.suggestions")}
                    links={FEATURED_COLLECTION_IDS.map((id) => ({ label: tp(`collections.${id}`), href: `/products?category=${id}` }))}
                  />
                </EmptyState>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                  <div>
                    <WishlistToolbar
                      sortKey={sortKey}
                      onSortChange={setSortKey}
                      readyCount={readyCount}
                      onAddAll={handleAddAllToCart}
                      onClearAll={handleClearAll}
                      labels={{
                        sort: t("sort.label"),
                        sortOptions: {
                          recent: t("sort.recent"),
                          priceAsc: t("sort.priceAsc"),
                          priceDesc: t("sort.priceDesc"),
                        },
                        addAll: t("actions.addAll"),
                        clearAll: t("actions.clearAll"),
                        confirmClear: t("actions.confirmClear"),
                        cancel: t("actions.cancel"),
                      }}
                    />

                    {canDrag ? (
                      <p className="mt-4 flex items-center gap-2 text-xs text-[var(--text-light)]">
                        <Hand size={14} strokeWidth={1.5} className="text-[var(--accent-color)]" />
                        {t("cartPanel.dragTip")}
                      </p>
                    ) : null}

                    <motion.div layout className={`mt-5 sm:mt-7 ${GRID_CLASS}`}>
                      <AnimatePresence mode="popLayout">
                        {items.map((item, index) => (
                          <DraggableWishlistCard
                            key={item.slug}
                            item={item}
                            index={index}
                            locale={locale}
                            canDrag={canDrag}
                            dropRef={dropRef}
                            onDragChange={setIsDragging}
                            onOverChange={setIsOver}
                            onDropToCart={handleDrop}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Cột phải (desktop): khung giỏ hàng = vùng thả, bắt đầu ngang tiêu đề, cao hết màn hình và ghim khi cuộn */}
        {hasItems ? (
          <div className="hidden lg:block">
            {/* Ghim đúng vị trí ban đầu (header đo thật + --page-y) nên không nhảy khi cuộn; cao vừa phần màn hình còn lại → luôn thấy đủ cả khung */}
            <div className="sticky top-[calc(var(--site-header-h)+var(--page-y))] h-[calc(100svh-var(--site-header-h)-var(--page-y)-1rem)]">
              <WishlistCartPanel
                dropRef={dropRef}
                locale={locale}
                isDragging={isDragging}
                isOver={isOver}
                addedSignal={addedSignal}
              />
            </div>
          </div>
        ) : null}
      </div>
    </MotionConfig>
  );
}
