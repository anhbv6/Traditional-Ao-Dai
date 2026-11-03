import { Archive, Megaphone, PencilLine, ShoppingBag, type LucideIcon } from "lucide-react";
import { type CollectionStatus } from "../types/collections.types";

/** Icon + màu cho từng trạng thái — màu ngữ nghĩa theo AGENTS.md §8 (amber chờ, emerald đang hoạt động) */
export const COLLECTION_STATUS_META: Record<CollectionStatus, { icon: LucideIcon; badgeClass: string }> = {
  DRAFT: {
    icon: PencilLine,
    badgeClass: "border border-dashed border-[#D4D4D8] bg-white text-[#52525B]",
  },
  COMING_SOON: { icon: Megaphone, badgeClass: "bg-amber-50 text-amber-800" },
  ACTIVE: { icon: ShoppingBag, badgeClass: "bg-emerald-50 text-emerald-700" },
  ARCHIVED: { icon: Archive, badgeClass: "bg-[#F4F4F5] text-[#3F3F46]" },
};

/** Màu nhấn mặc định khi bộ sưu tập chưa chọn màu */
export const DEFAULT_ACCENT = "#71717A";

/** Bảng màu gợi ý cho màu nhấn của mùa */
export const ACCENT_PRESETS = ["#9F1239", "#B45309", "#15803D", "#0E7490", "#4338CA", "#A21CAF", "#3F3F46"];
