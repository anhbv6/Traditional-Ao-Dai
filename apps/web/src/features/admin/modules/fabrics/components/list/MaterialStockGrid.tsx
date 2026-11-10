"use client";

import { Plus } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { type AdminFabricRoll, type FabricColorOption, type FabricMaterialOption } from "../../types/fabrics.types";
import { resolveFabricStatus, roundMeters, topsLeft } from "../../utils/fabricStock";
import { FabricSwatch } from "../shared/FabricSwatch";

const STATUS_TEXT_CLASS = {
  OK: "text-[#09090B]",
  LOW: "text-amber-700",
  OUT: "text-rose-600",
  INACTIVE: "text-[#A1A1AA]",
} as const;

interface MaterialStockGridProps {
  materials: FabricMaterialOption[];
  rolls: AdminFabricRoll[];
  colors: FabricColorOption[];
  onOpenRoll: (roll: AdminFabricRoll) => void;
  onAddRoll: (materialId: string) => void;
}

/**
 * Xem theo chất liệu: mỗi thẻ là một chất liệu — tổng mét đang dùng được, tổng thân áo còn cắt (tính riêng từng cây),
 * rồi các cây vải theo màu. Trả lời câu hỏi "lụa còn đủ nhận thêm đơn không?" mà không phải cộng tay trong bảng.
 */
export function MaterialStockGrid({ materials, rolls, colors, onOpenRoll, onAddRoll }: MaterialStockGridProps) {
  const t = useTranslations("AdminPage.fabrics");
  const format = useFormatter();
  const locale = useLocale();
  const fmt = (value: number) => format.number(value, { maximumFractionDigits: 2 });
  const hexOf = (colorId: string | null) => colors.find((color) => color.id === colorId)?.hex ?? null;

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {materials.map((material) => {
        const own = rolls.filter((roll) => roll.materialId === material.id);
        const usable = own.filter((roll) => roll.isActive);
        const totalMeters = roundMeters(usable.reduce((sum, roll) => sum + roll.remainingMeters, 0));
        const tops = material.metersPerTop
          ? usable.reduce((sum, roll) => sum + (topsLeft(roll.remainingMeters, material.metersPerTop) ?? 0), 0)
          : null;
        const attention = usable.filter((roll) => ["LOW", "OUT"].includes(resolveFabricStatus(roll))).length;

        return (
          <section key={material.id} className={cn(ADMIN_CARD_CLASS, "flex flex-col p-5")}>
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-[#09090B]">
                  {locale === "en" && material.nameEn ? material.nameEn : material.name}
                </h2>
                <p className="mt-0.5 text-xs text-[#71717A]">
                  {[
                    material.widthCm && t("material.width", { width: material.widthCm }),
                    material.metersPerTop ? t("material.perTop", { meters: fmt(material.metersPerTop) }) : t("noYield"),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {attention > 0 && (
                <span className="shrink-0 whitespace-nowrap rounded-md bg-amber-50 px-2 py-0.5 text-2xs font-medium text-amber-700">
                  {t("material.attention", { count: attention })}
                </span>
              )}
            </header>

            <div className="mt-4 flex items-baseline gap-3">
              <p className="font-mono text-3xl font-bold tabular-nums text-[#09090B]">
                {fmt(totalMeters)}
                <span className="ml-1 font-sans text-sm font-medium text-[#71717A]">m</span>
              </p>
              {tops !== null && <p className="text-sm text-[#71717A]">{t("topsLeft", { count: tops })}</p>}
            </div>

            <div className="my-4 border-t border-dashed border-[#E4E4E7]" aria-hidden />

            {own.length === 0 ? (
              <p className="py-2 text-sm text-[#71717A]">{t("material.empty")}</p>
            ) : (
              <ul className="-mx-2 space-y-0.5">
                {own.map((roll) => {
                  const status = resolveFabricStatus(roll);
                  const share = totalMeters > 0 && roll.isActive ? (roll.remainingMeters / totalMeters) * 100 : 0;
                  return (
                    <li key={roll.id}>
                      <button
                        type="button"
                        onClick={() => onOpenRoll(roll)}
                        className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#FAFAFA]"
                      >
                        <FabricSwatch hex={hexOf(roll.colorId)} size="sm" className={cn(!roll.isActive && "opacity-40")} />
                        <span className={cn("min-w-0 flex-1 truncate text-sm", roll.isActive ? "text-[#3F3F46]" : "text-[#A1A1AA] line-through")}>
                          {roll.name}
                        </span>
                        {/* Phần của cây này trong tổng — nhìn ra màu nào đang gánh chất liệu */}
                        <span aria-hidden className="hidden h-1 w-16 overflow-hidden rounded-full bg-[#F4F4F5] sm:block">
                          <span className="block h-full rounded-full bg-[#A1A1AA]" style={{ width: `${share}%` }} />
                        </span>
                        <span className={cn("w-16 text-right font-mono text-sm tabular-nums", STATUS_TEXT_CLASS[status])}>
                          {fmt(roll.remainingMeters)} m
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              onClick={() => onAddRoll(material.id)}
              className="mt-auto inline-flex cursor-pointer items-center gap-1.5 self-start pt-3 text-sm text-[#71717A] transition-colors hover:text-[#09090B]"
            >
              <Plus size={14} aria-hidden /> {t("material.addRoll")}
            </button>
          </section>
        );
      })}
    </div>
  );
}
