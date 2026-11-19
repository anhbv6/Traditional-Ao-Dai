"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminFilterSelect, AdminTooltip } from "@/features/admin/core/ui";
import {
  CARE_ICONS,
  CompositionBar,
  MaterialSwatch,
  MetricBars,
  isCareCode,
  isFiber,
} from "@/features/admin/modules/materials";
import { type AdminProductMaterialOption, type ProductSetItem } from "../../types/products.types";

const INHERIT = "__main__";

/**
 * Các món trong bộ (áo, quần, khăn, mấn...):
 * Thiết kế dạng nối dây (timeline nodes) liên kết trực quan.
 * Cột trái: Cụm nhập tên món + số lượng + xóa (Hàng 1) và Chọn chất liệu (Hàng 2).
 * Cột phải: Khối Preview đặc tính chất liệu vải thu gọn (chiếm 2 hàng chiều cao).
 */
export function ProductSetItemsField({
  items,
  onChange,
  materials,
  lang,
  mainMaterialId,
  inputClassName: _inputClassName,
}: {
  items: ProductSetItem[];
  onChange: (items: ProductSetItem[]) => void;
  materials: AdminProductMaterialOption[];
  lang: "vi" | "en";
  mainMaterialId?: string | null;
  inputClassName?: string;
}) {
  const t = useTranslations("AdminPage.products.set");
  const tMat = useTranslations("AdminPage.products.material");
  const tCare = useTranslations("AdminPage.materials.careCode");

  const labelKey = lang === "vi" ? "label" : "labelEn";
  const update = (index: number, patch: Partial<ProductSetItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const canAddMore = items.length < 8;

  return (
    <ol className="relative space-y-0">
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        const showLine = !isLast || canAddMore;

        const isInherited = item.materialId === null;
        const resolvedMaterialId = item.materialId ?? mainMaterialId ?? null;
        const effectiveMaterial = materials.find((m) => m.id === resolvedMaterialId) ?? null;

        const careCodes = effectiveMaterial ? effectiveMaterial.careCodes.filter(isCareCode) : [];
        const maxCareIcons = 4;
        const visibleCare = careCodes.slice(0, maxCareIcons);
        const remainingCare = careCodes.slice(maxCareIcons);
        const hasMoreCare = remainingCare.length > 0;

        return (
          <li key={index} className="relative flex gap-3 pb-4">
            {/* Đường dây nối xuống node tiếp theo hoặc node thêm món */}
            {showLine && (
              <span
                aria-hidden
                className="absolute left-[13px] top-7 bottom-0 w-px bg-[#E4E4E7]"
              />
            )}

            {/* Node tròn số thứ tự dạng timeline */}
            <span
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold select-none",
                isFirst
                  ? "border border-[#18181B] bg-[#18181B] text-white shadow-2xs"
                  : "border border-[#E4E4E7] bg-white text-[#18181B]"
              )}
            >
              {index + 1}
            </span>

            {/* Nội dung khối nhập liệu cho từng món */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col md:flex-row items-stretch gap-2.5">
                {/* Cột trái: Chiếm 2 hàng (Hàng 1: Tên + SL + Xoá; Hàng 2: Chọn chất liệu) */}
                <div className="min-w-0 flex-1 flex flex-col justify-between gap-2">
                  {/* Hàng 1: Cụm input liên kết liền khối: Tên món + Bộ chỉnh số lượng + Nút xóa */}
                  <div
                    className={cn(
                      "flex h-9.5 items-stretch rounded-lg border border-[#E4E4E7] bg-white transition-[border-color,box-shadow] duration-200 focus-within:border-[#18181B] focus-within:ring-2 focus-within:ring-[#18181B]/8",
                      lang === "vi" && !item.label.trim() && "border-amber-400"
                    )}
                  >
                    {/* Ô nhập tên món */}
                    <input
                      value={item[labelKey]}
                      onChange={(e) => update(index, { [labelKey]: e.target.value })}
                      placeholder={t(`placeholder.${lang}`)}
                      aria-invalid={lang === "vi" && !item.label.trim()}
                      className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-[#09090B] placeholder:text-[#A1A1AA] outline-none"
                    />

                    {/* Cụm chỉnh số lượng: Liền khối, có vạch ngăn, có nút +/- bấm nhanh */}
                    <div className="flex items-center border-l border-[#E4E4E7] bg-[#FAFAFA] px-1 text-xs select-none">
                      <span className="pl-1.5 pr-1 font-medium text-[#71717A]">SL:</span>
                      <button
                        type="button"
                        disabled={item.quantity <= 1}
                        onClick={() => update(index, { quantity: Math.max(1, item.quantity - 1) })}
                        className="grid size-6 cursor-pointer place-items-center rounded text-[#71717A] transition-colors hover:bg-[#E4E4E7] hover:text-[#09090B] disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none"
                        aria-label={t("decreaseQty")}
                      >
                        <Minus size={12} />
                      </button>
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
                        className="w-7 bg-transparent text-center font-mono text-sm font-semibold tabular-nums text-[#09090B] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        disabled={item.quantity >= 20}
                        onClick={() => update(index, { quantity: Math.min(20, item.quantity + 1) })}
                        className="grid size-6 cursor-pointer place-items-center rounded text-[#71717A] transition-colors hover:bg-[#E4E4E7] hover:text-[#09090B] disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none"
                        aria-label={t("increaseQty")}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Nút xoá món */}
                    <button
                      type="button"
                      onClick={() => onChange(items.filter((_, i) => i !== index))}
                      aria-label={t("remove")}
                      title={t("remove")}
                      className="grid size-9.5 shrink-0 cursor-pointer place-items-center border-l border-[#E4E4E7] text-[#A1A1AA] transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Hàng 2: Dropdown Chọn chất liệu (chiếm full width cột trái) */}
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
                    className="h-9 w-full text-xs"
                  />
                </div>

                {/* Cột phải: Preview đặc tính chất liệu vải thu gọn (chiếm 2 hàng bên phải) */}
                {effectiveMaterial && (
                  <div className="w-full md:w-[370px] lg:w-[400px] shrink-0">
                    <div className="flex h-full min-h-[84px] gap-2.5 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-2 text-xs">
                      {/* Ảnh ô vải mẫu cắt răng cưa */}
                      <MaterialSwatch
                        src={effectiveMaterial.cover}
                        className="h-auto w-14 shrink-0 self-stretch rounded-t-sm"
                      />

                      <div className="min-w-0 flex-1 flex flex-col justify-between gap-1.5">
                        {/* Hàng 1: Thành phần sợi + Link Hồ sơ */}
                        <div className="flex items-start justify-between gap-2">
                          <CompositionBar
                            items={effectiveMaterial.composition.flatMap((item) =>
                              isFiber(item.fiber) ? [{ fiber: item.fiber, percent: item.percent }] : []
                            )}
                            className="min-w-0 flex-1 [&_p]:text-2xs [&_p]:mt-0.5"
                          />
                          <div className="flex shrink-0 items-center gap-1.5">
                            {isInherited && (
                              <span className="rounded bg-[#E4E4E7] px-1 py-0.5 text-3xs font-medium text-[#52525B]">
                                {t("inheritedFromMain")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hàng 2: 5 thanh đo thuộc tính vải + Các ký hiệu bảo quản */}
                        <div className="flex items-end justify-between gap-2">
                          <MetricBars
                            metrics={effectiveMaterial.metrics}
                            className="w-[150px] sm:w-[160px] gap-1 [&_span.text-2xs]:text-[10.5px] [&_span.text-2xs]:tracking-tight"
                          />
                          <div className="flex shrink-0 items-center gap-1" aria-label={tMat("care")}>
                            {visibleCare.map((code) => {
                              const Icon = CARE_ICONS[code];
                              return (
                                <AdminTooltip key={code} content={tCare(code)}>
                                  <span
                                    role="img"
                                    aria-label={tCare(code)}
                                    className="grid size-5 place-items-center rounded-full border border-[#D4D4D8] bg-white text-[#3F3F46]"
                                  >
                                    <Icon size={10} aria-hidden />
                                  </span>
                                </AdminTooltip>
                              );
                            })}
                            {hasMoreCare && (
                              <AdminTooltip content={remainingCare.map((c) => tCare(c)).join(" · ")}>
                                <span
                                  role="img"
                                  aria-label={t("careNotesCount", { count: remainingCare.length })}
                                  className="grid size-5 place-items-center rounded-full border border-[#D4D4D8] bg-white font-mono text-[11px] font-semibold text-[#52525B] transition-colors hover:border-[#18181B] hover:text-[#18181B] select-none cursor-default"
                                >
                                  +
                                </span>
                              </AdminTooltip>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}

      {/* Điểm nối cuối cùng: Nút thêm món */}
      {canAddMore && (
        <li className="relative flex gap-3 pt-0.5">
          <button
            type="button"
            onClick={() => onChange([...items, { label: "", labelEn: "", quantity: 1, materialId: null }])}
            className="group flex cursor-pointer items-center gap-3 text-left focus-visible:outline-none"
          >
            <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-dashed border-[#D4D4D8] bg-white text-[#71717A] transition-colors group-hover:border-[#18181B] group-hover:bg-[#FAFAFA] group-hover:text-[#18181B]">
              <Plus size={13} aria-hidden />
            </span>
            <span className="text-sm font-medium text-[#71717A] transition-colors group-hover:text-[#18181B]">
              {t("add")}
            </span>
          </button>
        </li>
      )}
    </ol>
  );
}
