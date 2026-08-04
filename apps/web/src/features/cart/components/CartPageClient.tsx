"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Plus, Minus, ShoppingBag, Tag, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/container";

type CartItem = {
  id: number;
  name: string;
  slug: string;
  image: string;
  quantity: number;
  price: number;
  size: string;
};

export function CartPageClient() {
  const t = useTranslations("Common");
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [activeDiscount, setActiveDiscount] = useState<{
    code: string;
    type: "percentage" | "freeship";
    value: number;
  } | null>(null);
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
    // Trigger custom event to notify CartButton inside Header
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

  if (!isLoaded) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[#800020] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 animate-fade-in font-[family-name:var(--font-lora)] text-[var(--text-main)]">
      {/* Back button */}
      <Link 
        href="/products" 
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#706565] hover:text-[#800020] transition-colors"
      >
        <ArrowLeft size={14} />
        {t("continueShopping") || "Tiếp tục mua sắm"}
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-extrabold text-[#800020] sm:text-4xl">
        Giỏ Hàng Của Bạn
      </h1>

      {cartItems.length === 0 ? (
        /* Empty Cart View */
        <div className="mt-12 flex flex-col items-center justify-center text-center py-16 px-4 bg-[#FAF7F5] border border-[#E2D9D2]/40 rounded-2xl animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#706565]/40 border border-[#E2D9D2]/30 shadow-sm">
            <ShoppingBag size={36} />
          </div>
          <h2 className="mt-6 text-xl font-bold font-[family-name:var(--font-playfair)] text-[#800020]">
            Giỏ hàng của bạn đang trống
          </h2>
          <p className="mt-2 text-sm text-[#706565] max-w-sm">
            Hãy khám phá các thiết kế áo dài cao cấp của chúng tôi và chọn cho mình sản phẩm phù hợp.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#800020] px-8 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90 cursor-pointer active:scale-95 duration-200"
          >
            Mua Sắm Ngay
          </Link>
        </div>
      ) : (
        /* Cart Page Content split into 2 Columns */
        <div className="mt-8 grid gap-8 lg:grid-cols-3 items-start">
          {/* Left Column: Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-[#800020]/10 bg-white p-4 sm:p-6 shadow-xs divide-y divide-[#E2D9D2]/40">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 py-5 first:pt-0 last:pb-0 group">
                  {/* Image */}
                  <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl bg-[#FAF7F5] border border-[#E2D9D2]/30">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 80px, 96px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Item Info & Actions */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-[family-name:var(--font-playfair)] text-sm sm:text-base font-bold text-[#800020] hover:text-[#800020]/90">
                          <Link href={`/products/${item.slug}`} className="hover:underline">
                            {item.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-xs text-[#706565]">
                          Kích cỡ: <span className="font-bold text-[#2A2525]">{item.size}</span>
                        </p>
                      </div>
                      <p className="text-sm sm:text-base font-extrabold text-[#2A2525]">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {/* Quantity Selector */}
                      <div className="flex items-center rounded-lg border border-[#E2D9D2] bg-[#FAF7F5] p-0.5">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="flex size-7 items-center justify-center rounded-md text-[#706565] hover:bg-white hover:text-[#800020] transition-colors cursor-pointer disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={11} />
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                          className="w-10 text-center text-xs font-bold text-[#2A2525] bg-transparent outline-none border-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="flex size-7 items-center justify-center rounded-md text-[#706565] hover:bg-white hover:text-[#800020] transition-colors cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      {/* Trash Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="flex size-8 items-center justify-center rounded-lg text-[#706565]/60 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer active:scale-90"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Summary & Coupon */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Promo Code Form */}
            <div className="rounded-2xl border border-[#800020]/10 bg-white p-5 shadow-xs">
              <h3 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[#800020] flex items-center gap-2">
                <Tag size={16} />
                Mã Khuyến Mãi
              </h3>
              <form onSubmit={handleApplyPromo} className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: GIAM10, FREESHIP"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 h-9 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] outline-none text-[#2A2525] focus:border-[#800020]/50 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-[#800020] px-4 text-xs font-bold text-white transition-colors hover:bg-[#800020]/90 cursor-pointer active:scale-95"
                >
                  Áp dụng
                </button>
              </form>
              {promoError && (
                <p className="mt-2 text-[11px] font-semibold text-rose-600 animate-fade-in">
                  ✕ {promoError}
                </p>
              )}
              {promoSuccess && (
                <p className="mt-2 text-[11px] font-semibold text-emerald-600 animate-fade-in">
                  ✓ {promoSuccess}
                </p>
              )}
            </div>

            {/* Order Summary */}
            <div className="rounded-2xl border border-[#800020]/10 bg-[#FAF7F5] p-5 shadow-xs">
              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#800020] border-b border-[#E2D9D2]/60 pb-3">
                Tóm tắt đơn hàng
              </h3>

              <div className="mt-4 space-y-3 text-xs text-[#706565]">
                <div className="flex items-center justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-[#2A2525]">${subtotal.toFixed(2)}</span>
                </div>

                {activeDiscount && (
                  <div className="flex items-center justify-between text-emerald-600 font-medium">
                    <span>Mã giảm giá ({activeDiscount.code})</span>
                    {activeDiscount.type === "percentage" ? (
                      <span>-${discountAmount.toFixed(2)}</span>
                    ) : (
                      <span>Freeship</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>Phí vận chuyển</span>
                  {shippingCost === 0 ? (
                    <span className="text-emerald-600 font-semibold">Miễn phí</span>
                  ) : (
                    <span className="font-semibold text-[#2A2525]">${shippingCost.toFixed(2)}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>Thuế VAT (8%)</span>
                  <span className="font-semibold text-[#2A2525]">${tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-[#E2D9D2]/60 pt-3 flex items-end justify-between">
                  <span className="text-sm font-bold text-[#2A2525]">Tổng cộng</span>
                  <span className="text-lg font-extrabold text-[#800020]">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Add free shipping progress indicator if shipping cost is charged */}
              {shippingCost > 0 && (
                <div className="mt-4 p-3 bg-white border border-[#E2D9D2]/30 rounded-lg text-[10px] text-[#706565]">
                  <p>
                    Mua thêm <span className="font-bold text-[#800020]">${(shippingThreshold - subtotal).toFixed(2)}</span> để được <strong>Miễn phí vận chuyển</strong>!
                  </p>
                  <div className="mt-2 w-full h-1.5 bg-[#FAF7F5] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#800020] transition-all duration-500" 
                      style={{ width: `${(subtotal / shippingThreshold) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="mt-6 flex min-h-11 items-center justify-center rounded-lg bg-[#800020] text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90 cursor-pointer text-center active:scale-95 duration-200"
              >
                Tiến Hành Thanh Toán
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
