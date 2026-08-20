"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { type CartItem, type ActiveDiscount } from "../types/cart.types";

export function useCart() {
  const t = useTranslations("Common");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [activeDiscount, setActiveDiscount] = useState<ActiveDiscount | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cart_items");
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse cart items on cart page", err);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sync to localStorage and notify other components when cartItems state changes
  const updateCart = (newItems: CartItem[]) => {
    setCartItems(newItems);
    localStorage.setItem("cart_items", JSON.stringify(newItems));
    window.dispatchEvent(new Event("cart-updated"));
  };

  // Quantity handlers
  const handleQuantityChange = (id: number, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    updateCart(updated);
  };

  const handleQuantityInput = (id: number, value: string) => {
    const parsed = parseInt(value.replace(/\D/g, "")) || 1;
    const updated = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, parsed) };
      }
      return item;
    });
    updateCart(updated);
  };

  // Remove item handler
  const handleRemoveItem = (id: number) => {
    const updated = cartItems.filter(item => item.id !== id);
    updateCart(updated);
  };

  // Promo code apply handler
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(null);

    const cleanCode = promoCode.trim().toUpperCase();
    if (!cleanCode) {
      setPromoError("Vui lòng nhập mã giảm giá");
      return;
    }

    if (cleanCode === "GIAM10" || cleanCode === "DISCOUNT10") {
      setActiveDiscount({
        code: cleanCode,
        type: "percentage",
        value: 10, // 10% off
      });
      setPromoSuccess("Áp dụng mã giảm giá 10% thành công!");
    } else if (cleanCode === "FREESHIP") {
      setActiveDiscount({
        code: cleanCode,
        type: "freeship",
        value: 100, // free shipping
      });
      setPromoSuccess("Áp dụng mã miễn phí vận chuyển thành công!");
    } else {
      setPromoError("Mã giảm giá không hợp lệ hoặc đã hết hạn");
    }
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Calculate discount amount
  let discountAmount = 0;
  let isFreeShipping = false;

  if (activeDiscount) {
    if (activeDiscount.type === "percentage") {
      discountAmount = subtotal * (activeDiscount.value / 100);
    } else if (activeDiscount.type === "freeship") {
      isFreeShipping = true;
    }
  }

  // Shipping cost: free if subtotal > $150 or if free shipping code is applied
  const shippingThreshold = 150;
  const standardShipping = 10;
  const shippingCost = (subtotal > shippingThreshold || isFreeShipping || subtotal === 0) ? 0 : standardShipping;

  // Tax calculation (8% VAT on subtotal after discount)
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = taxableAmount * 0.08;

  // Total
  const total = taxableAmount + shippingCost + tax;

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
    handleRemoveItem,
    handleApplyPromo,
    subtotal,
    discountAmount,
    shippingThreshold,
    shippingCost,
    tax,
    total,
  };
}
