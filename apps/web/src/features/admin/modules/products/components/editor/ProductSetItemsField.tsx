"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminFilterSelect } from "@/features/admin/core/ui";
import { type AdminProductMaterialOption, type ProductSetItem } from "../../types/products.types";

const INHERIT = "__main__";

/**
 * Các món trong bộ (áo, quần, khăn, mấn...):
 * Thiết kế tinh gọn, bỏ border hộp bọc ngoài thừa thãi, giữ nguyên cấu trúc khối nhập liệu thoáng đãng.
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
    <div className="space-y-3">
      {/* Danh sách món: Không bọc border hộp bao ngoài từng món, mỗi món thoáng đãng, dễ nhìn */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            {/* Hàng 1: Số thứ tự + Ô nhập tên món + Ô số lượng + Nút xóa */}
            <div className="flex items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded bg-[#F4F4F5] font-mono text-xs font-semibold text-[#52525B]">
                {index + 1}
              </span>
              <input
                value={item[labelKey]}
                onChange={(e) => update(index, { [labelKey]: e.target.value })}
                placeholder={t(`placeholder.${lang}`)}
                aria-invalid={lang === "vi" && !item.label.trim()}
                className={cn(
                  inputClassName,
                  "h-9 min-w-0 flex-1 rounded-lg border border-[#E4E4E7] bg-white px-3 text-xs text-[#09090B] placeholder:text-[#A1A1AA] transition-colors focus:border-[#18181B] focus:outline-none aria-invalid:border-amber-400"
                )}
              />
              <div className="relative w-18 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={item.quantity}
                  onChange={(e) =>
                    update(index, {
                      quantity: Math.max(1, Math.min(20, Math.round(Number(e.target.value) || 1))),
                    })
                  }
                  aria-label={t("quantity")}
                  className={cn(
                    inputClassName,
                    "h-9 w-full rounded-lg border border-[#E4E4E7] bg-white pr-5 text-right font-mono text-xs tabular-nums text-[#09090B] transition-colors focus:border-[#18181B] focus:outline-none"
                  )}
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-[#A1A1AA]">
                  ×
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label={t("remove")}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Hàng 2: Chọn chất liệu riêng nếu khác chất liệu chính — rộng rãi, không bị cụt text */}
            <AdminFilterSelect
              label={t("material")}
              value={item.materialId ?? INHERIT}
              options={[
                { value: INHERIT, label: t("materialInherit") },
                ...materials
                  .filter((m) => m.isActive || m.id === item.materialId)
                  .map((m) => ({ value: m.id, label: m.name })),
              ]}
              onChange={(value) => update(index, { materialId: value === INHERIT ? null : value })}
              className="ml-8 h-9 w-[calc(100%-2rem)] text-xs"
            />
          </div>
        ))}
      </div>

      {/* Nút thêm món: tinh tế, không border nét đứt thừa thãi */}
      {items.length < 8 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onChange([...items, { label: "", labelEn: "", quantity: 1, materialId: null }])}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[#18181B] transition-colors hover:text-[#52525B]"
          >
            <Plus size={14} aria-hidden /> {t("add")}
          </button>
        </div>
      )}
    </div>
  );
}
