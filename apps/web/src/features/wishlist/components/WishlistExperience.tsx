"use client";

import React from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { formatVnd } from "@repo/shared";
import { useWishlist } from "../hooks/useWishlist";
import { WishlistCard } from "./WishlistCard";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { WishlistToolbar } from "./WishlistToolbar";
import { UndoSnackbar } from "@/components/shared/UndoSnackbar";

const EASE = [0.22, 1, 0.36, 1] as const;
const GRID_CLASS = "grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10";

/** Khung chờ khi đang nạp từ localStorage — tránh chớp trạng thái "trống" */
function WishlistSkeleton() {
  return (
    <div className={GRID_CLASS} aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4] bg-[var(--bg-secondary)]" />
          <div className="mt-3 h-3 w-3/4 bg-[var(--bg-secondary)]" />
          <div className="mt-2 h-3 w-1/3 bg-[var(--bg-secondary)]" />
          <div className="mt-3 h-9 bg-[var(--bg-secondary)]" />
        </div>
      ))}
    </div>
  );
}

export function WishlistExperience() {
  const {
    t,
    locale,
    isLoaded,
    items,
    totalValue,
    readyCount,
    sortKey,
    setSortKey,
    lastRemoved,
    handleRemove,
    handleUndo,
    dismissUndo,
    handleClearAll,
    handlePrimaryAction,
    handleAddAllToCart,
  } = useWishlist();

  const cardLabels = {
    remove: t("actions.remove"),
    addToCart: t("actions.addToCart"),
    customTailor: t("actions.customTailor"),
    custom: t("status.custom"),
    sale: t("status.sale"),
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="font-[family-name:var(--font-lora)] text-[var(--text-main)]">
        {/* Tiêu đề */}
        <header className="mb-6 sm:mb-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 text-[10px] uppercase tracking-[3px] text-[var(--text-light)] sm:text-[11px]"
          >
            <motion.span
              aria-hidden="true"
              className="h-px w-8 origin-left bg-[var(--primary-color)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
            />
            {t("eyebrow")}
          </motion.p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
                className="text-2xl font-semibold leading-tight sm:text-3xl"
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
            </div>

            {/* Thống kê: số thiết kế + tổng giá trị (số nhảy khi thay đổi) */}
            {isLoaded && items.length > 0 ? (
              <motion.dl
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex shrink-0 items-stretch divide-x divide-[var(--border)] border border-[var(--border)] text-[11px] sm:text-xs"
              >
                <div className="px-3 py-1.5">
                  <dt className="sr-only">{t("itemCount", { count: items.length })}</dt>
                  <dd className="overflow-hidden uppercase tracking-[1.5px] text-[var(--text-light)]">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={items.length}
                        className="block"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        transition={{ duration: 0.35, ease: EASE }}
                      >
                        {t("itemCount", { count: items.length })}
                      </motion.span>
                    </AnimatePresence>
                  </dd>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <dt className="uppercase tracking-[1.5px] text-[var(--text-light)]">{t("totalValue")}</dt>
                  <dd className="font-semibold text-[var(--primary-color)]">{formatVnd(totalValue, locale)}</dd>
                </div>
              </motion.dl>
            ) : null}
          </div>
        </header>

        {!isLoaded ? (
          <WishlistSkeleton />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {items.length === 0 ? (
              <EmptyState
                key="empty"
                icon={Heart}
                title={t("empty.title")}
                description={t("empty.description")}
                action={t("empty.action")}
              />
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
              >
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

                <motion.div layout className={`mt-5 sm:mt-7 ${GRID_CLASS}`}>
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                      <WishlistCard
                        key={item.slug}
                        item={item}
                        index={index}
                        locale={locale}
                        labels={cardLabels}
                        onRemove={handleRemove}
                        onPrimaryAction={handlePrimaryAction}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <UndoSnackbar
          activeKey={lastRemoved?.slug ?? null}
          message={lastRemoved ? t("undo.removed", { name: lastRemoved.name }) : ""}
          undoLabel={t("actions.undo")}
          closeLabel={t("actions.close")}
          onUndo={handleUndo}
          onDismiss={dismissUndo}
        />
      </div>
    </MotionConfig>
  );
}
