"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeSearchText } from "../utils/search";

/** Số từ khóa gần đây được giữ lại */
const MAX_HISTORY = 6;

interface SearchHistoryState {
  queries: string[];
  /** Thêm lên đầu, bỏ bản trùng (không phân biệt dấu / hoa thường) */
  add: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
}

/**
 * Lịch sử tìm kiếm của khách trên trình duyệt này (chỉ là từ khóa, không phải dữ liệu nhạy cảm).
 * Chỉ đọc khi mở bảng tìm kiếm (sau tương tác) nên không cần `skipHydration`.
 */
export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      queries: [],
      add: (query) => {
        const value = query.trim();
        if (!value) return;
        const key = normalizeSearchText(value);
        set((state) => ({
          queries: [value, ...state.queries.filter((item) => normalizeSearchText(item) !== key)].slice(0, MAX_HISTORY),
        }));
      },
      remove: (query) => set((state) => ({ queries: state.queries.filter((item) => item !== query) })),
      clear: () => set({ queries: [] }),
    }),
    {
      name: "aodai-search-history",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
