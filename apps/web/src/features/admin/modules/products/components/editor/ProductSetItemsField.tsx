"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminFilterSelect } from "@/features/admin/core/ui";
import { type AdminProductMaterialOption, type ProductSetItem } from "../../types/products.types";

const INHERIT = "__main__";

/**
 * Các món trong bộ (áo, quần, khăn...) — mỗi món có số lượng và chất liệu riêng nếu khác chất liệu chính;
 * cả bộ bán chung một giá và một size bộ
 */
export function ProductSetItemsField({
  items,
  onChange,
  materials,
  lang,
  inputClassName,
}: {
  items: ProductSetItem[];
  onChange: (items: ProductSetItem[]) => void;
  materials: AdminProductMaterialOption[];
  lang: "vi" | "en";
  inputClassName: string;
}) {
  const t = useTranslations("AdminPage.products.set");
  const labelKey = lang === "vi" ? "label" : "labelEn";
  const update = (index: number, patch: Partial<ProductSetItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        // Món trong bộ không có id — thứ tự ổn định trong một lần sửa
        <div key={index} className="space-y-2 rounded-lg border border-[#E4E4E7] p-2">
          <div className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#F4F4F5] font-mono text-xs font-semibold text-[#52525B]">
              {index + 1}
            </span>
            <input
              value={item[labelKey]}
              onChange={(e) => update(index, { [labelKey]: e.target.value })}
              placeholder={t(`placeholder.${lang}`)}
              aria-invalid={lang === "vi" && !item.label.trim()}
              className={cn(inputClassName, "h-9 min-w-0 flex-1 aria-invalid:border-amber-400")}
            />
            <div className="relative w-16 shrink-0">
              <input
                type="number"
                min={1}
                max={20}
                value={item.quantity}
                onChange={(e) => update(index, { quantity: Math.max(1, Math.min(20, Math.round(Number(e.target.value) || 1))) })}
                aria-label={t("quantity")}
                className={cn(inputClassName, "h-9 pr-6 text-right font-mono tabular-nums")}
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-[#A1A1AA]">
                ×
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              aria-label={t("remove")}
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-rose-600"
            >
              <X size={15} />
            </button>
          </div>
          {/* Món có chất liệu khác chất liệu chính (VD quần lụa trơn đi cùng áo gấm) */}
          <AdminFilterSelect
            label={t("material")}
            value={item.materialId ?? INHERIT}
            options={[
              { value: INHERIT, label: t("materialInherit") },
              ...materials.filter((m) => m.isActive || m.id === item.materialId).map((m) => ({ value: m.id, label: m.name })),
            ]}
            onChange={(value) => update(index, { materialId: value === INHERIT ? null : value })}
            className="ml-9 h-9 w-[calc(100%-2.25rem)]"
          />
        </div>
      ))}
      {items.length < 8 && (
        <button
          type="button"
          onClick={() => onChange([...items, { label: "", labelEn: "", quantity: 1, materialId: null }])}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-dashed border-[#D4D4D8] px-2.5 text-xs font-medium text-[#52525B] hover:border-[#A1A1AA] hover:text-[#09090B]"
        >
          <Plus size={13} aria-hidden /> {t("add")}
        </button>
      )}
    </div>
  );
}
