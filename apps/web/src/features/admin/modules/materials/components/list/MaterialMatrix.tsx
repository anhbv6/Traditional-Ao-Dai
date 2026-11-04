"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { type AdminMaterialListItem } from "../../types/materials.types";
import { MATERIAL_METRICS, SEASONS, SEASON_ICONS, type MaterialMetric } from "../../utils/materialMeta";
import { MaterialSwatch } from "../shared/MaterialSwatch";
import { MetricScale } from "../shared/MetricBars";

type Sort = { key: MaterialMetric; dir: "desc" | "asc" } | null;

/**
 * Ma trận so sánh: mỗi hàng một chất liệu, mỗi cột một thanh đo 1–5. Bấm tiêu đề cột để xếp theo thanh đo
 * (VD tìm vải rủ nhất cho áo dài cách tân, vải ít thấu nhất cho áo cưới).
 */
export function MaterialMatrix({ materials }: { materials: AdminMaterialListItem[] }) {
  const t = useTranslations("AdminPage.materials");
  const format = useFormatter();
  const [sort, setSort] = useState<Sort>(null);

  const rows = sort
    ? [...materials].sort((a, b) => {
        // Chưa đánh giá luôn xuống cuối
        const fallback = sort.dir === "desc" ? -1 : 99;
        const av = a.metrics[sort.key] ?? fallback;
        const bv = b.metrics[sort.key] ?? fallback;
        return sort.dir === "desc" ? bv - av : av - bv;
      })
    : materials;

  const toggleSort = (key: MaterialMetric) =>
    setSort((prev) => (prev?.key !== key ? { key, dir: "desc" } : prev.dir === "desc" ? { key, dir: "asc" } : null));

  return (
    <section className={cn(ADMIN_CARD_CLASS, "overflow-x-auto")}>
      <table className="w-full min-w-[600px] text-body">
        <thead>
          <tr className="border-b border-[#E4E4E7] bg-[#FAFAFA] text-left text-body font-semibold whitespace-nowrap text-[#3F3F46]">
            <th className="px-4 py-2.5">{t("matrix.material")}</th>
            {MATERIAL_METRICS.map((key) => {
              const active = sort?.key === key;
              const Arrow = sort?.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={key}
                  className={cn("px-1.5 py-2.5", active && "bg-[#F4F4F5]")}
                  aria-sort={active ? (sort.dir === "desc" ? "descending" : "ascending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1 uppercase hover:text-[#09090B]",
                      active && "text-[#09090B]"
                    )}
                  >
                    {/* Tiêu đề ngắn cho vừa bảng; tên đầy đủ ở tooltip */}
                    <span title={t(`metrics.${key}.label`)}>{t(`metrics.${key}.short`)}</span>
                    {active && <Arrow size={12} aria-hidden />}
                  </button>
                </th>
              );
            })}
            <th className="px-2 py-2.5">{t("matrix.seasons")}</th>
            <th className="px-2 py-2.5 text-right">{t("matrix.perTop")}</th>
            <th className="px-3 py-2.5 text-right">{t("matrix.stock")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F4F4F5]">
          {rows.map((material) => (
            <tr key={material.id} className={cn("hover:bg-[#FAFAFA]", !material.isActive && "opacity-60")}>
              <td className="px-4 py-2.5">
                <Link href={`/admin/catalog/materials/${material.id}`} className="flex min-w-0 items-center gap-3">
                  <MaterialSwatch src={material.cover} className="size-9 shrink-0 rounded-t-md" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-[#09090B] hover:underline">{material.name}</span>
                    <span className="block font-mono text-2xs text-[#71717A]">{material.code}</span>
                  </span>
                </Link>
              </td>
              {MATERIAL_METRICS.map((key) => (
                <td key={key} className={cn("px-1.5 py-2.5", sort?.key === key && "bg-[#FAFAFA]")}>
                  <div className="flex items-center gap-2">
                    <MetricScale value={material.metrics[key]} label={t(`metrics.${key}.label`)} size="sm" />
                    <span className="w-3 font-mono text-xs tabular-nums text-[#71717A]">
                      {material.metrics[key] ?? "–"}
                    </span>
                  </div>
                </td>
              ))}
              <td className="px-2 py-2.5">
                <div className="flex gap-1">
                  {SEASONS.map((season) => {
                    const Icon = SEASON_ICONS[season];
                    return (
                      <Icon
                        key={season}
                        size={14}
                        aria-label={t(`season.${season}`)}
                        className={material.seasons.includes(season) ? "text-[#18181B]" : "text-[#E4E4E7]"}
                      />
                    );
                  })}
                </div>
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-right font-mono tabular-nums">
                {material.metersPerTop !== null ? `${format.number(material.metersPerTop)} m` : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums">
                {format.number(material.remainingMeters)} m
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
