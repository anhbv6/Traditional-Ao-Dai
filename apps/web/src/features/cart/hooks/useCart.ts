"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@repo/shared";
import { useCartHydrated, useCartStore } from "../store/cartStore";
import { calculateCartTotals, findDemoDiscount } from "../utils/pricing";
import { useCartUndo } from "./useCartUndo";

export function useCart() {
  const t = useTranslations("CartPage");
  const locale = useLocale() as Locale;
  const isLoaded = useCartHydrated();
  const cartItems = useCartStore((state) => state.items);
  const activeDiscount = useCartStore((state) => state.discount);
  const { updateQuantity, applyDiscount } = useCartStore.getState();
  const { removeWithUndo, clearWithUndo } = useCartUndo();

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  // Xóa dòng / xóa cả giỏ đều hiện thông báo có "Hoàn tác" (useCartUndo)
  const handleClearAll = () => {
    clearWithUndo();
    setPromoCode("");
    setPromoError(null);
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);

    if (!promoCode.trim()) {
      setPromoError(t("promo.required"));
      return;
    }

    const discount = findDemoDiscount(promoCode);
    if (!discount) {
      setPromoError(t("promo.invalid"));
      return;
    }

    applyDiscount(discount);
    setPromoCode("");
  };

  const handleRemovePromo = () => {
    applyDiscount(null);
    setPromoError(null);
  };

  // Mô tả mã đang áp dụng suy ra từ store (còn đúng sau khi tải lại trang)
  const promoDescription = activeDiscount
    ? activeDiscount.type === "percentage"
      ? t("promo.percentApplied", { value: activeDiscount.value })
      : t("promo.freeshipApplied")
    : null;

  const totals = calculateCartTotals(cartItems, activeDiscount);

  return {
    t,
    locale,
    isLoaded,
    cartItems,
    totals,
    hasCustomItems: cartItems.some((item) => item.measurements),
    promoCode,
    setPromoCode: (value: string) => {
      setPromoCode(value);
      if (promoError) setPromoError(null);
    },
    promoError,
    activeDiscount,
    promoDescription,
    handleApplyPromo,
    handleRemovePromo,
    handleQuantityChange: updateQuantity,
    handleRemoveItem: removeWithUndo,
    handleClearAll,
  };
}
