"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@repo/shared";
import { showToast } from "@/components/ui/toast";
import { UNDO_TIMEOUT } from "@/components/shared/UndoSnackbar";
import { useCartHydrated, useCartStore } from "../store/cartStore";
import { calculateCartTotals, findDemoDiscount } from "../utils/pricing";
import { type CartItem } from "../types/cart.types";

interface RemovedLine {
  item: CartItem;
  index: number;
}

export function useCart() {
  const t = useTranslations("CartPage");
  const locale = useLocale() as Locale;
  const isLoaded = useCartHydrated();
  const cartItems = useCartStore((state) => state.items);
  const activeDiscount = useCartStore((state) => state.discount);
  const { updateQuantity, removeItem, restoreItem, applyDiscount, clear } = useCartStore.getState();

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [lastRemoved, setLastRemoved] = useState<RemovedLine | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  const dismissUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastRemoved(null);
  };

  const handleRemoveItem = (id: string) => {
    const index = cartItems.findIndex((item) => item.id === id);
    if (index === -1) return;
    // Hoàn tác không khôi phục mã giảm giá đã bị gỡ khi giỏ trống — khách nhập lại nếu cần
    removeItem(id);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastRemoved({ item: cartItems[index], index });
    undoTimerRef.current = setTimeout(() => setLastRemoved(null), UNDO_TIMEOUT);
  };

  const handleUndo = () => {
    if (lastRemoved) restoreItem(lastRemoved.item, lastRemoved.index);
    dismissUndo();
  };

  const handleClearAll = () => {
    dismissUndo();
    clear();
    setPromoCode("");
    setPromoError(null);
    showToast.success(t("toast.cleared"));
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
    handleRemoveItem,
    handleClearAll,
    lastRemoved,
    handleUndo,
    dismissUndo,
  };
}
