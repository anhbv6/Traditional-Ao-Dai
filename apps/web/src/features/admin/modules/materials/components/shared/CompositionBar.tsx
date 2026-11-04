"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type CompositionItem } from "../../types/materials.types";
import { COMPOSITION_SHADES } from "../../utils/materialMeta";

/** Thanh thành phần sợi xếp chồng theo %, kèm dòng chữ "70% Tơ tằm · 30% Cotton" */
export function CompositionBar({
  items,
  showLabel = true,
  className,
}: {
  items: CompositionItem[];
  showLabel?: boolean;
  className?: string;
}) {
  const t = useTranslations("AdminPage.materials");
  if (items.length === 0) {
    return showLabel ? <p className={cn("text-xs text-[#A1A1AA]", className)}>{t("composition.empty")}</p> : null;
  }
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-[#F4F4F5]">
        {items.map((item, index) => (
          <span
            key={item.fiber}
            style={{ width: `${item.percent}%` }}
            className={COMPOSITION_SHADES[index % COMPOSITION_SHADES.length]}
          />
        ))}
      </div>
      {showLabel && (
        <p className="mt-1.5 truncate text-xs text-[#52525B]">
          {items.map((item) => `${item.percent}% ${t(`fiber.${item.fiber}`)}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
