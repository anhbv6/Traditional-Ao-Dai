"use client";

import { ExternalLink } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { AdminFilterSelect } from "@/features/admin/core/ui";
import {
  CARE_ICONS,
  CompositionBar,
  MaterialSwatch,
  MetricBars,
  isCareCode,
  isFiber,
} from "@/features/admin/modules/materials";
import { type AdminProductMaterialOption } from "../../types/products.types";

const NONE = "__none__";

/**
 * Chọn chất liệu chính; thông số hiện ngay bên dưới là KẾ THỪA từ hồ sơ chất liệu (thanh đo, thành phần,
 * bảo quản, định mức) — sửa ở màn chất liệu, không nhập lại cho từng sản phẩm
 */
export function ProductMaterialField({
  value,
  onChange,
  materials,
}: {
  value: string | null;
  onChange: (materialId: string | null) => void;
  materials: AdminProductMaterialOption[];
}) {
  const t = useTranslations("AdminPage.products.material");
  const tCare = useTranslations("AdminPage.materials.careCode");
  const format = useFormatter();
  const selected = materials.find((m) => m.id === value) ?? null;

  return (
    <div className="space-y-3">
      <AdminFilterSelect
        label={t("label")}
        value={value ?? NONE}
        options={[
          { value: NONE, label: t("none") },
          ...materials
            .filter((m) => m.isActive || m.id === value)
            .map((m) => ({ value: m.id, label: `${m.name} · ${m.code}` })),
        ]}
        onChange={(next) => onChange(next === NONE ? null : next)}
        className="h-10 w-full"
      />

      {selected && (
        <div className="flex gap-3 rounded-lg bg-[#FAFAFA] p-3">
          <MaterialSwatch src={selected.cover} className="h-20 w-16 shrink-0 rounded-t-md" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <CompositionBar
                items={selected.composition.flatMap((item) =>
                  isFiber(item.fiber) ? [{ fiber: item.fiber, percent: item.percent }] : []
                )}
                className="min-w-0 flex-1"
              />
              <Link
                href={`/admin/catalog/materials/${selected.id}`}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#52525B] hover:text-[#09090B] hover:underline"
              >
                {t("open")} <ExternalLink size={11} aria-hidden />
              </Link>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <MetricBars metrics={selected.metrics} className="w-[150px]" />
              <div className="flex flex-wrap gap-1" aria-label={t("care")}>
                {selected.careCodes.filter(isCareCode).map((code) => {
                  const Icon = CARE_ICONS[code];
                  return (
                    <span
                      key={code}
                      title={tCare(code)}
                      className="grid size-6 place-items-center rounded-full border border-[#D4D4D8] bg-white text-[#3F3F46]"
                    >
                      <Icon size={12} aria-hidden />
                    </span>
                  );
                })}
              </div>
            </div>
            {(selected.metersPerTop !== null || selected.metersPerPants !== null) && (
              <p className="text-xs text-[#71717A]">
                {t("yield", {
                  top: selected.metersPerTop !== null ? format.number(selected.metersPerTop) : "—",
                  pants: selected.metersPerPants !== null ? format.number(selected.metersPerPants) : "—",
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
