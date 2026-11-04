"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Nhãn hiển thị / ẩn của loại sản phẩm — emerald = đang hiện trên cửa hàng (AGENTS.md §8) */
export function CategoryStatusBadge({ isActive, className }: { isActive: boolean; className?: string }) {
  const t = useTranslations("AdminPage.categories.status");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#F4F4F5] text-[#71717A]",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-[#A1A1AA]")} aria-hidden />
      {isActive ? t("active") : t("hidden")}
    </span>
  );
}
