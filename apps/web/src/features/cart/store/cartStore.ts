"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type ActiveDiscount, type CartItem, type NewCartItem } from "../types/cart.types";
import { clampQuantity } from "../utils/pricing";

interface CartState {
  items: CartItem[];
  discount: ActiveDiscount | null;

  addItem: (item: NewCartItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  /** Khôi phục dòng vừa xóa về đúng vị trí cũ (hoàn tác) */
  restoreItem: (item: CartItem, index: number) => void;
  applyDiscount: (discount: ActiveDiscount | null) => void;
  clear: () => void;
}

/** Số đo khác nhau là hai sản phẩm may đo khác nhau -> phải là hai dòng riêng */
const buildCartItemId = ({ slug, size, color, measurements }: NewCartItem) => {
  const measureKey = measurements
    ? Object.keys(measurements)
        .sort()
        .map((key) => `${key}:${measurements[key]}`)
        .join(",")
    : "";
  return [slug, size, color ?? "", measureKey].join("__");
};

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
          const id = buildCartItemId(item);
          const quantity = clampQuantity(item.quantity ?? 1);
          const existing = state.items.find((cartItem) => cartItem.id === id);

          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === id ? { ...cartItem, quantity: clampQuantity(cartItem.quantity + quantity) } : cartItem
              ),
            };
          }

          return { items: [...state.items, { ...item, id, quantity }] };
        }),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: clampQuantity(quantity) } : item
          ),
        })),

      // Giỏ trống thì gỡ luôn mã giảm giá (mã gắn với đơn, không gắn với khách)
      removeItem: (id) =>
        set((state) => {
          const items = state.items.filter((item) => item.id !== id);
          return { items, discount: items.length > 0 ? state.discount : null };
        }),

      restoreItem: (item, index) =>
        set((state) => {
          if (state.items.some((entry) => entry.id === item.id)) return state;
          const items = [...state.items];
          items.splice(Math.min(index, items.length), 0, item);
          return { items };
        }),

      applyDiscount: (discount) => set({ discount }),

      clear: () => set({ items: [], discount: null }),
    }),
    {
      name: "aodai-cart",
      version: 2,
      // v1 -> v2: khóa dòng thêm màu/số đo -> tính lại id để dòng cũ vẫn cộng dồn đúng
      migrate: (persisted, version) => {
        const state = persisted as Pick<CartState, "items" | "discount">;
        if (version < 2 && Array.isArray(state?.items)) {
          return { ...state, items: state.items.map((item) => ({ ...item, id: buildCartItemId(item) })) };
        }
        return state;
      },
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
