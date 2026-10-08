"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type ActiveDiscount, type CartItem, type NewCartItem } from "../types/cart.types";

interface CartState {
  items: CartItem[];
  discount: ActiveDiscount | null;

  addItem: (item: NewCartItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  applyDiscount: (discount: ActiveDiscount | null) => void;
  clear: () => void;
}

const buildCartItemId = (slug: string, size: string) => `${slug}__${size}`;

/**
 * Giỏ hàng — NGUỒN DỮ LIỆU DUY NHẤT cho mini-cart (header), trang giỏ hàng và checkout.
 * Lưu localStorage qua zustand/persist (khách vãng lai). Khi có API giỏ hàng, đồng bộ với model `Cart` cho khách đã đăng nhập.
 * `skipHydration` + `rehydrateCart()` gọi ở AppProviders để tránh lệch hydration giữa server và client.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      discount: null,

      addItem: (item) =>
        set((state) => {
          const id = buildCartItemId(item.slug, item.size);
          const quantity = Math.max(1, item.quantity ?? 1);
          const existing = state.items.find((cartItem) => cartItem.id === id);

          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === id ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem
              ),
            };
          }

          return { items: [...state.items, { ...item, id, quantity }] };
        }),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, Math.floor(quantity) || 1) } : item
          ),
        })),

      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      applyDiscount: (discount) => set({ discount }),

      clear: () => set({ items: [], discount: null }),
    }),
    {
      name: "aodai-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items, discount: state.discount }),
    }
  )
);

/** Nạp giỏ hàng từ localStorage (gọi 1 lần phía client) */
export function rehydrateCart() {
  // Dọn dữ liệu giỏ hàng định dạng cũ (USD, đồng bộ bằng window event)
  try {
    localStorage.removeItem("cart_items");
  } catch {
    // Trình duyệt chặn storage -> bỏ qua
  }
  void useCartStore.persist.rehydrate();
}

/** true khi giỏ hàng đã nạp xong từ localStorage — dùng để tránh hiển thị "giỏ trống" chớp nhoáng */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
}
