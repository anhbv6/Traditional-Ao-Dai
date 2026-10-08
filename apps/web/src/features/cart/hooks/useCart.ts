"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCartHydrated, useCartStore } from "../store/cartStore";
import { calculateCartTotals, findDemoDiscount } from "../utils/pricing";

export function useCart() {
  const t = useTranslations("Common");
  const isLoaded = useCartHydrated();
  const cartItems = useCartStore((state) => state.items);
  const activeDiscount = useCartStore((state) => state.discount);
  const { updateQuantity, removeItem, applyDiscount } = useCartStore.getState();

  // Promo code form state
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  const handleQuantityChange = (id: string, delta: number) => {
    const item = cartItems.find((cartItem) => cartItem.id === id);
    if (item) updateQuantity(id, item.quantity + delta);
  };

  const handleQuantityInput = (id: string, value: string) => {
    updateQuantity(id, parseInt(value.replace(/\D/g, ""), 10) || 1);
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(null);

    if (!promoCode.trim()) {
      setPromoError(t("cartMessages.promoRequired"));
      return;
    }

    const discount = findDemoDiscount(promoCode);
    if (!discount) {
      setPromoError(t("cartMessages.promoInvalid"));
      return;
    }

    applyDiscount(discount);
    setPromoSuccess(
      discount.type === "percentage"
        ? t("cartMessages.promoPercentApplied", { value: discount.value })
        : t("cartMessages.promoFreeshipApplied")
    );
  };

  const totals = calculateCartTotals(cartItems, activeDiscount);

  return {
    t,
    cartItems,
    isLoaded,
    promoCode,
    setPromoCode,
    activeDiscount,
    promoError,
    promoSuccess,
    handleQuantityChange,
    handleQuantityInput,
    handleRemoveItem: removeItem,
    handleApplyPromo,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    shippingThreshold: totals.freeShippingThreshold,
    shippingCost: totals.shippingCost,
    total: totals.total,
  };
}
