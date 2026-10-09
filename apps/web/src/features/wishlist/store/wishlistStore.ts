"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type NewWishlistItem, type WishlistItem } from "../types/wishlist.types";

interface WishlistState {
  items: WishlistItem[];

  /** Thêm nếu chưa có, bỏ nếu đã có. Trả về `true` khi sản phẩm vừa được thêm */
  toggle: (item: NewWishlistItem) => boolean;
  remove: (slug: string) => void;
  /** Khôi phục một mục vừa xóa (giữ nguyên thời điểm thêm cũ) */
  restore: (item: WishlistItem) => void;
  clear: () => void;
}

/**
 * Danh sách yêu thích — NGUỒN DỮ LIỆU DUY NHẤT cho nút tim (thẻ sản phẩm, trang chi tiết), header và trang wishlist.
 * Lưu localStorage qua zustand/persist (khách vãng lai). Khi có API wishlist, đồng bộ cho khách đã đăng nhập.
 * `skipHydration` + `rehydrateWishlist()` gọi ở AppProviders để tránh lệch hydration giữa server và client.
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (item) => {
        const exists = get().items.some((entry) => entry.slug === item.slug);
        set((state) => ({
          items: exists
            ? state.items.filter((entry) => entry.slug !== item.slug)
            : [{ ...item, addedAt: Date.now() }, ...state.items],
        }));
        return !exists;
      },

      remove: (slug) => set((state) => ({ items: state.items.filter((item) => item.slug !== slug) })),

      restore: (item) =>
        set((state) =>
          state.items.some((entry) => entry.slug === item.slug) ? state : { items: [...state.items, item] }
        ),

      clear: () => set({ items: [] }),
    }),
    {
      name: "aodai-wishlist",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    }
  )
);

/** Nạp danh sách yêu thích từ localStorage (gọi 1 lần phía client) */
export function rehydrateWishlist() {
  void useWishlistStore.persist.rehydrate();
}

/** true khi danh sách đã nạp xong từ localStorage — tránh hiển thị "trống" chớp nhoáng */
export function useWishlistHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useWishlistStore.persist.onFinishHydration(onChange),
    () => useWishlistStore.persist.hasHydrated(),
    () => false
  );
}

/** Sản phẩm có đang nằm trong danh sách yêu thích không */
export function useIsWishlisted(slug: string | undefined): boolean {
  return useWishlistStore((state) => (slug ? state.items.some((item) => item.slug === slug) : false));
}
