"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { type WishlistItem } from "../types/wishlist.types";
import { initialWishlistItems } from "../data/mockWishlist";
import { showToast } from "@/components/ui/toast";

export function useWishlist() {
  const t = useTranslations("WishlistPage");
  const locale = useLocale() as "vi" | "en";
  const [items, setItems] = useState<WishlistItem[]>(initialWishlistItems);

  const handleRemove = (id: string) => {
    const item = items.find((item) => item.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (item) {
      showToast.success(t("toast.removed"), item.name[locale]);
    } else {
      showToast.success(t("toast.removed"));
    }
  };

  const handleClearAll = () => {
    setItems([]);
    showToast.success(t("toast.cleared"));
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (item.stockStatus === "out_of_stock") return;
    showToast.success(t("toast.addedToCart"), item.name[locale]);
  };

  return {
    t,
    locale,
    items,
    handleRemove,
    handleClearAll,
    handleAddToCart,
  };
}
