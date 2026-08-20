"use client";

import React from "react";
import { ShoppingCart, Trash2, Heart, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useWishlist } from "../hooks/useWishlist";
import { type WishlistItem } from "../types/wishlist.types";

export function WishlistExperience() {
  const {
    t,
    locale,
    items,
    handleRemove,
    handleClearAll,
    handleAddToCart,
  } = useWishlist();

  const getStatusBadge = (status: WishlistItem["stockStatus"]) => {
    switch (status) {
      case "in_stock":
        return (
          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 border border-green-200">
            {t("status.inStock")}
          </span>
        );
      case "custom":
        return (
          <span className="inline-flex items-center rounded-md bg-[#800020]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#800020] border border-[#800020]/15">
            {t("status.custom")}
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
            {t("status.outOfStock")}
          </span>
        );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2D9D2]/60 pb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Heart className="text-[#800020] fill-[#800020]" size={28} />
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#800020] sm:text-4xl">
              {t("title")}
            </h1>
          </div>
          <p className="mt-2.5 max-w-2xl text-sm text-[#706565] leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#706565] bg-white border border-[#E2D9D2] px-3.5 py-2 rounded-lg">
              {t("itemCount", { count: items.length })}
            </span>
            <button
              onClick={handleClearAll}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-bold uppercase tracking-wider text-rose-600 px-4 transition-all duration-300 cursor-pointer"
            >
              {t("actions.clearAll")}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="my-16 rounded-2xl border border-[#E2D9D2]/70 bg-white p-12 text-center shadow-xs max-w-lg mx-auto"
          >
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#FAF7F5] text-[#800020]/45">
              <Heart size={32} />
            </div>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
              {t("empty.title")}
            </h2>
            <p className="mt-2 text-xs text-[#706565] leading-relaxed max-w-xs mx-auto">
              {t("empty.description")}
            </p>
            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#800020] px-6 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#800020]/90"
              >
                <span>{t("empty.action")}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-full">
            {items.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#800020]/10 bg-white shadow-xs hover:shadow-md transition-all duration-300"
              >
                {/* Image Section */}
                <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF7F5]">
                  <Image
                    src={item.image}
                    alt={item.name[locale]}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />

                  {/* Badges Overlays */}
                  <div className="absolute left-3 top-3 flex flex-col gap-1.5 items-start">
                    {getStatusBadge(item.stockStatus)}
                    <span className="inline-flex items-center rounded-md bg-white/80 backdrop-blur-xs px-2 py-0.5 text-[9px] font-semibold text-[#706565]">
                      {item.category[locale]}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-[#706565] shadow-xs hover:bg-[#800020] hover:text-white transition-colors cursor-pointer outline-none border-none"
                    title={t("actions.remove")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Details Section */}
                <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-[15px] sm:text-base font-bold text-[#800020] line-clamp-1">
                      {item.name[locale]}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-[#2A2525] font-[family-name:var(--font-lora)]">
                      {item.price}
                    </p>
                  </div>

                  {/* Add to Cart Actions */}
                  <div>
                    {item.stockStatus === "out_of_stock" ? (
                      <button
                        disabled
                        className="flex w-full min-h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-[#E2D9D2] bg-gray-50 text-xs font-semibold text-gray-400"
                      >
                        {t("status.outOfStock")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className={`flex w-full min-h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                          item.stockStatus === "custom"
                            ? "bg-[#800020] text-white hover:bg-[#800020]/90"
                            : "border border-[#800020]/25 bg-white text-[#800020] hover:bg-[#800020] hover:text-white"
                        }`}
                      >
                        {item.stockStatus === "custom" ? (
                          <>
                            <Sparkles size={14} />
                            <span>{t("actions.customTailor")}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={14} />
                            <span>{t("actions.addToCart")}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
