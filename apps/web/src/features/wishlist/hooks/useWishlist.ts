"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@repo/shared";
import { useCartStore } from "@/features/cart";
import { useRouter } from "@/i18n/routing";
import { showToast } from "@/components/ui/toast";
import { UNDO_TIMEOUT } from "@/components/shared/UndoSnackbar";
import { useWishlistHydrated, useWishlistStore } from "../store/wishlistStore";
import { type WishlistItem, type WishlistSortKey } from "../types/wishlist.types";

/** Size mặc định khi thêm nhanh vào giỏ (đồng bộ với ProductCard) — khách đổi size ở trang giỏ / chi tiết */
const QUICK_ADD_SIZE = "M";

const sorters: Record<WishlistSortKey, (a: WishlistItem, b: WishlistItem) => number> = {
  recent: (a, b) => b.addedAt - a.addedAt,
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
};

export function useWishlist() {
  const t = useTranslations("WishlistPage");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const isLoaded = useWishlistHydrated();
  const rawItems = useWishlistStore((state) => state.items);
  const { remove, restore, clear } = useWishlistStore.getState();

  const [sortKey, setSortKey] = useState<WishlistSortKey>("recent");
  const [lastRemoved, setLastRemoved] = useState<WishlistItem | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  const items = useMemo(() => [...rawItems].sort(sorters[sortKey]), [rawItems, sortKey]);
  const totalValue = useMemo(() => rawItems.reduce((sum, item) => sum + item.price, 0), [rawItems]);

  const dismissUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastRemoved(null);
  };

  const handleRemove = (item: WishlistItem) => {
    remove(item.slug);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastRemoved(item);
    undoTimerRef.current = setTimeout(() => setLastRemoved(null), UNDO_TIMEOUT);
  };

  const handleUndo = () => {
    if (lastRemoved) restore(lastRemoved);
    dismissUndo();
  };

  const handleClearAll = () => {
    dismissUndo();
    clear();
    showToast.success(t("toast.cleared"));
  };

  const addToCart = (item: WishlistItem) =>
    useCartStore.getState().addItem({
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
      size: QUICK_ADD_SIZE,
    });

  /** Hàng may sẵn -> thêm thẳng vào giỏ; hàng may đo -> sang trang chi tiết để nhập số đo */
  const handlePrimaryAction = (item: WishlistItem) => {
    if (item.purchaseType === "custom") {
      router.push(`/products/${item.slug}`);
      return;
    }
    addToCart(item);
    showToast.success(t("toast.addedToCart"), item.name);
  };

  const readyItems = rawItems.filter((item) => item.purchaseType === "ready");

  const handleAddAllToCart = () => {
    if (readyItems.length === 0) {
      showToast.info(t("toast.nothingToAdd"));
      return;
    }
    readyItems.forEach(addToCart);
    showToast.success(t("toast.addedAllToCart", { count: readyItems.length }));
  };

  return {
    t,
    locale,
    isLoaded,
    items,
    totalValue,
    readyCount: readyItems.length,
    sortKey,
    setSortKey,
    lastRemoved,
    handleRemove,
    handleUndo,
    dismissUndo,
    handleClearAll,
    handlePrimaryAction,
    handleAddAllToCart,
  };
}
