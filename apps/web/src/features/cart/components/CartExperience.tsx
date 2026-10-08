"use client";

import React from "react";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useCart } from "../hooks/useCart";
import { CartItemList } from "./CartItemList";
import { CartPromoSection } from "./CartPromoSection";
import { CartSummary } from "./CartSummary";

export function CartExperience() {
  const {
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
    total,
  } = useCart();

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
            <CartItemList
              cartItems={cartItems}
              handleQuantityChange={handleQuantityChange}
              handleQuantityInput={handleQuantityInput}
              handleRemoveItem={handleRemoveItem}
            />
          </div>

          {/* Right Column: Summary & Coupon */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <CartPromoSection
              promoCode={promoCode}
              setPromoCode={setPromoCode}
              handleApplyPromo={handleApplyPromo}
              promoError={promoError}
              promoSuccess={promoSuccess}
            />
            <CartSummary
              subtotal={subtotal}
              activeDiscount={activeDiscount}
              discountAmount={discountAmount}
              shippingCost={shippingCost}
              shippingThreshold={shippingThreshold}
              total={total}
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default CartExperience;
