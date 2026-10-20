"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@repo/shared";
import { useCartStore } from "@/features/cart";
import { showToast } from "@/components/ui/toast";
import { useWishlistHydrated, useWishlistStore } from "../store/wishlistStore";
import { useWishlistUndo } from "./useWishlistUndo";
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
  const isLoaded = useWishlistHydrated();
  const rawItems = useWishlistStore((state) => state.items);

  const [sortKey, setSortKey] = useState<WishlistSortKey>("recent");
  const { clearWithUndo } = useWishlistUndo();

  const items = useMemo(() => [...rawItems].sort(sorters[sortKey]), [rawItems, sortKey]);

  // Xóa toàn bộ có "Hoàn tác" (useWishlistUndo)
  const handleClearAll = clearWithUndo;

  const addToCart = (item: WishlistItem) =>
    useCartStore.getState().addItem({
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
      size: QUICK_ADD_SIZE,
    });

  /**
   * Thả thẻ vào khung giỏ hàng: hàng may sẵn -> thêm vào giỏ (size M);
   * hàng may đo -> không thêm (cần nhập số đo ở trang chi tiết), chỉ nhắc khách.
   * Trả về `true` khi đã thêm để khung giỏ hiện hiệu ứng xác nhận.
   */
  const handleDropToCart = (item: WishlistItem) => {
    if (item.purchaseType === "custom") {
      showToast.info(t("toast.customDropped", { name: item.name }));
      return false;
    }
    addToCart(item);
    showToast.success(t("toast.addedToCart"), `${item.name} · ${QUICK_ADD_SIZE}`);
    return true;
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
    readyCount: readyItems.length,
    sortKey,
    setSortKey,
    handleClearAll,
    handleDropToCart,
    handleAddAllToCart,
  };
}
