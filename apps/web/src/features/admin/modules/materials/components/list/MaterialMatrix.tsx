"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminTooltip } from "@/features/admin/core/ui";
import { type AdminMaterialListItem } from "../../types/materials.types";
import { MATERIAL_METRICS, SEASONS, SEASON_ICONS, type MaterialMetric } from "../../utils/materialMeta";
import { MaterialSwatch } from "../shared/MaterialSwatch";

type Sort = { key: MaterialMetric; dir: "desc" | "asc" } | null;

/**
 * Ma trận so sánh chất liệu vải: mỗi hàng một loại vải, mỗi cột một thanh đo 1–5.
 * Bấm tiêu đề cột để xếp theo thanh đo (VD tìm vải rủ nhất cho áo dài cách tân, vải ít thấu nhất cho áo cưới).
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
    <section className={cn(ADMIN_CARD_CLASS, "@container overflow-hidden")}>
      {/* Banner hiển thị tiêu chí đang sắp xếp */}
      {sort && (
        <div className="flex items-center justify-between border-b border-[#E4E4E7] bg-[#FAFAFA] px-4 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#3F3F46]">
            <span className="text-[#71717A]">{t("matrix.activeSort", { metric: t(`metrics.${sort.key}.label`) })}:</span>
            <span className="font-medium text-[#09090B]">
              {sort.dir === "desc" ? t("matrix.sortDesc") : t("matrix.sortAsc")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSort(null)}
            className="inline-flex cursor-pointer items-center gap-1 text-2xs text-[#71717A] transition-colors hover:text-[#09090B]"
          >
            <X size={12} aria-hidden />
            <span>{t("matrix.clearSort")}</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-separate border-spacing-0 text-body">
          <thead>
            <tr className="h-11 bg-[#FAFAFA]/80 text-xs font-medium text-[#71717A]">
              <th className="w-[300px] border-b border-dashed border-[#E4E4E7] pl-4 pr-3 text-left font-medium">
                {t("matrix.material")}
              </th>

              {MATERIAL_METRICS.map((key) => {
                const active = sort?.key === key;
                const Arrow = sort?.dir === "asc" ? ArrowUp : ArrowDown;
                const tooltipHeader = active
                  ? `${t(`metrics.${key}.label`)}: ${sort.dir === "desc" ? t("matrix.sortDesc") : t("matrix.sortAsc")}`
                  : t("matrix.sortBy", { metric: t(`metrics.${key}.label`) });

                return (
                  <th
                    key={key}
                    className={cn(
                      "w-[95px] border-b border-dashed border-[#E4E4E7] px-2 py-2.5 text-left font-medium transition-colors",
                      active && "bg-[#F4F4F5]/60"
                    )}
                    aria-sort={active ? (sort.dir === "desc" ? "descending" : "ascending") : "none"}
                  >
                    <AdminTooltip content={tooltipHeader}>
                      <button
                        type="button"
                        aria-label={t(`metrics.${key}.label`)}
                        onClick={() => toggleSort(key)}
                        className={cn(
                          "group inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition-colors",
                          active
                            ? "bg-[#18181B] text-white shadow-2xs"
                            : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]"
                        )}
                      >
                        <span>{t(`metrics.${key}.short`)}</span>
                        {active ? (
                          <Arrow size={11} className="shrink-0" aria-hidden />
                        ) : (
                          <ArrowUpDown
                            size={11}
                            className="shrink-0 text-[#A1A1AA] opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden
                          />
                        )}
                      </button>
                    </AdminTooltip>
                  </th>
                );
              })}

              <th className="w-[100px] border-b border-dashed border-[#E4E4E7] px-3 py-2.5 text-left font-medium">
                {t("matrix.seasons")}
              </th>
              <th className="w-[100px] border-b border-dashed border-[#E4E4E7] px-3 py-2.5 text-right font-medium">
                {t("matrix.perTop")}
              </th>
              <th className="w-[140px] border-b border-dashed border-[#E4E4E7] px-3 py-2.5 text-right font-medium">
                {t("matrix.stock")}
              </th>
              <th className="w-10 border-b border-dashed border-[#E4E4E7] pr-4 pl-1">
                <span className="sr-only">{t("matrix.viewDetail")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((material) => (
              <tr
                key={material.id}
                className="group/row transition-colors hover:bg-[#FAFAFA] [&>td]:border-b [&>td]:border-dashed [&>td]:border-[#E4E4E7] last:[&>td]:border-b-0"
              >
                {/* Cột 1: Thông tin vải (Ảnh swatch mép răng cưa, tên, mã, xuất xứ, thành phần sợi) */}
                <td className="py-3.5 pl-4 pr-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/catalog/materials/${material.id}`} className="group/swatch relative shrink-0">
                      <MaterialSwatch
                        src={material.cover}
                        className="size-11 rounded-t-lg border-x border-t border-[#E4E4E7]/70 shadow-2xs transition-transform group-hover/swatch:scale-105"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/catalog/materials/${material.id}`}
                          className="truncate text-body font-medium text-[#09090B] transition-colors hover:text-[#18181B] hover:underline"
                        >
                          {material.name}
                        </Link>
                        {!material.isActive && (
                          <span className="shrink-0 rounded bg-[#F4F4F5] px-1.5 py-0.5 text-2xs font-medium text-[#71717A]">
                            {t("status.inactive")}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#71717A]">
                        <span className="font-mono text-2xs text-[#71717A]">{material.code}</span>
                        {material.origin && (
                          <>
                            <span className="text-2xs text-[#D4D4D8]">·</span>
                            <span className="truncate text-2xs text-[#71717A]">{material.origin}</span>
                          </>
                        )}
                      </div>
                      {material.composition.length > 0 && (
                        <p className="mt-0.5 truncate text-2xs text-[#52525B]">
                          {material.composition.map((c) => `${c.percent}% ${t(`fiber.${c.fiber}`)}`).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* 5 Cột: Thang đo vật lý */}
                {MATERIAL_METRICS.map((key) => {
                  const value = material.metrics[key];
                  const isSortActive = sort?.key === key;

                  let tooltipText = t("matrix.notEvaluated");
                  if (value !== null) {
                    const trait = value >= 4 ? t(`metrics.${key}.high`) : value <= 2 ? t(`metrics.${key}.low`) : null;
                    tooltipText = trait
                      ? `${t(`metrics.${key}.label`)}: ${value}/5 (${trait})`
                      : `${t(`metrics.${key}.label`)}: ${value}/5`;
                  }

                  return (
                    <td
                      key={key}
                      className={cn(
                        "whitespace-nowrap px-2 py-3.5 transition-colors",
                        isSortActive && "bg-[#F4F4F5]/30"
                      )}
                    >
                      <AdminTooltip content={tooltipText}>
                        <div className="inline-flex items-center gap-1.5">
                          {value !== null ? (
                            <>
                              <div className="flex items-center gap-0.5" aria-hidden>
                                {[1, 2, 3, 4, 5].map((lvl) => (
                                  <span
                                    key={lvl}
                                    className={cn(
                                      "h-2 w-1 rounded-[1px] transition-colors",
                                      lvl <= value ? "bg-[#18181B]" : "bg-[#E4E4E7]"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="font-mono text-xs font-semibold tabular-nums text-[#09090B]">
                                {value}
                                <span className="text-2xs font-normal text-[#A1A1AA]">/5</span>
                              </span>
                            </>
                          ) : (
                            <span className="font-mono text-xs text-[#D4D4D8]">—</span>
                          )}
                        </div>
                      </AdminTooltip>
                    </td>
                  );
                })}

                {/* Cột Mùa */}
                <td className="whitespace-nowrap px-3 py-3.5">
                  <div className="flex items-center gap-1">
                    {SEASONS.map((season) => {
                      const Icon = SEASON_ICONS[season];
                      const on = material.seasons.includes(season);
                      return (
                        <AdminTooltip key={season} content={t(`season.${season}`)}>
                          <span
                            className={cn(
                              "grid size-5 place-items-center rounded-sm transition-colors",
                              on ? "bg-[#F4F4F5] text-[#18181B]" : "text-[#D4D4D8]/60"
                            )}
                            aria-label={t(`season.${season}`)}
                          >
                            <Icon size={12} aria-hidden />
                          </span>
                        </AdminTooltip>
                      );
                    })}
                  </div>
                </td>

                {/* Cột Định mức */}
                <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono tabular-nums">
                  {material.metersPerTop !== null ? (
                    <span className="text-xs font-medium text-[#09090B]">
                      {format.number(material.metersPerTop)}{" "}
                      <span className="text-2xs font-normal text-[#71717A]">m</span>
                    </span>
                  ) : (
                    <span className="text-xs text-[#D4D4D8]">—</span>
                  )}
                </td>

                {/* Cột Tồn kho */}
                <td className="whitespace-nowrap px-3 py-3.5 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#09090B]">
                      {format.number(material.remainingMeters)}{" "}
                      <span className="text-2xs font-normal text-[#71717A]">m</span>
                    </span>
                    <span className="text-2xs text-[#71717A]">
                      {t("card.stock", { rolls: material.rollCount })}
                      {material.topsAvailable !== null && (
                        <span className="ml-1 text-[#71717A]">
                          · ≈ {t("card.tops", { count: material.topsAvailable })}
                        </span>
                      )}
                    </span>
                  </div>
                </td>

                {/* Cột Điều hướng xem chi tiết */}
                <td className="w-10 pr-4 pl-1 text-right">
                  <AdminTooltip content={t("matrix.viewDetail")}>
                    <Link
                      href={`/admin/catalog/materials/${material.id}`}
                      aria-label={t("matrix.viewDetail")}
                      className="grid size-8 place-items-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] group-hover/row:text-[#71717A]"
                    >
                      <ChevronRight size={16} aria-hidden />
                    </Link>
                  </AdminTooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
