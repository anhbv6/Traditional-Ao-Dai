"use client";

import { MapPin } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminTooltip } from "@/features/admin/core/ui";
import { type AdminMaterialListItem } from "../../types/materials.types";
import { SEASONS, SEASON_ICONS } from "../../utils/materialMeta";
import { CompositionBar } from "../shared/CompositionBar";
import { MaterialSwatch } from "../shared/MaterialSwatch";
import { MetricBars } from "../shared/MetricBars";

/** Thẻ chất liệu: ô vải mẫu → tên, xuất xứ, thành phần → thanh đo + mùa → định mức & kho */
export function MaterialCard({ material }: { material: AdminMaterialListItem }) {
  const t = useTranslations("AdminPage.materials");
  const format = useFormatter();

  return (
    <Link
      href={`/admin/catalog/materials/${material.id}`}
      className={cn(
        ADMIN_CARD_CLASS,
        "group flex flex-col overflow-hidden transition-shadow hover:shadow-[0_12px_28px_-18px_rgba(9,9,11,0.45)]",
        !material.isActive && "opacity-70"
      )}
    >
      <MaterialSwatch src={material.cover} className="aspect-[5/2]">
        <span className="absolute left-2.5 top-2.5 rounded bg-white/90 px-1.5 py-0.5 font-mono text-2xs font-semibold text-[#09090B] shadow-2xs">
          {material.code}
        </span>
        {!material.isActive && (
          <span className="absolute right-2.5 top-2.5 rounded bg-rose-50 px-1.5 py-0.5 text-2xs font-medium text-rose-700">
            {t("status.inactive")}
          </span>
        )}
      </MaterialSwatch>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-2">
        <div className="min-w-0">
          <h3 className="truncate text-body font-semibold text-[#09090B] group-hover:underline">{material.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#71717A]">
            <MapPin size={12} className="shrink-0" aria-hidden />
            {material.origin ?? t("card.noOrigin")}
          </p>
        </div>
        <CompositionBar items={material.composition} />

        <div className="flex items-end justify-between gap-3 border-t border-dashed border-[#E4E4E7] pt-3">
          <MetricBars metrics={material.metrics} className="w-[150px]" />
          <div className="flex gap-1" aria-label={t("field.seasons")}>
            {SEASONS.map((season) => {
              const Icon = SEASON_ICONS[season];
              const on = material.seasons.includes(season);
              return (
                <AdminTooltip key={season} content={t(`season.${season}`)}>
                  <span
                    role="img"
                    aria-label={t(`season.${season}`)}
                    className={cn(
                      "grid size-6 place-items-center rounded-md",
                      on ? "bg-[#18181B] text-white" : "bg-[#F4F4F5] text-[#D4D4D8]"
                    )}
                  >
                    <Icon size={12} aria-hidden />
                  </span>
                </AdminTooltip>
              );
            })}
          </div>
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-[#FAFAFA] px-2.5 py-2">
            <dt className="text-[#71717A]">{t("card.perTop")}</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums text-[#09090B]">
              {material.metersPerTop !== null ? `${format.number(material.metersPerTop)} m` : "—"}
            </dd>
          </div>
          <div className="rounded-lg bg-[#FAFAFA] px-2.5 py-2">
            <dt className="text-[#71717A]">{t("card.stock", { rolls: material.rollCount })}</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums text-[#09090B]">
              {format.number(material.remainingMeters)} m
              {material.topsAvailable !== null && (
                <span className="ml-1 font-sans text-xs font-normal text-[#71717A]">
                  ≈ {t("card.tops", { count: material.topsAvailable })}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
