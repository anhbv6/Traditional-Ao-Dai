"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Bản nháp số đo khách vãng lai đang nhập ở trang thiết kế riêng — lưu localStorage để F5 không mất.
 * Chỉ là số đo cơ thể (không phải dữ liệu đăng nhập); xóa sau khi đặt hàng thành công.
 */
interface MeasurementDraftState {
  values: Record<string, string> | null;
  save: (values: Record<string, string>) => void;
  clear: () => void;
}

export const useMeasurementDraftStore = create<MeasurementDraftState>()(
  persist(
    (set) => ({
      values: null,
      save: (values) => set({ values }),
      clear: () => set({ values: null }),
    }),
    {
      name: "aodai-measurement-draft",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

/** Nạp bản nháp số đo từ localStorage (gọi 1 lần phía client ở AppProviders) */
export function rehydrateMeasurementDraft() {
  void useMeasurementDraftStore.persist.rehydrate();
}

/** Xóa nháp số đo sau khi đặt hàng thành công */
export function clearMeasurementDraft() {
  useMeasurementDraftStore.getState().clear();
}
