"use client";

import { useState } from "react";
import { Lock, Sparkles, Trash2, Unlock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminInfoTip } from "@/features/admin/core/ui";
import { type AdminProductAttributeOption } from "../../types/products.types";
import {
  CUSTOM_SIZE,
  FREE_SIZE,
  buildVariantSku,
  comboKey,
  type SizeAxis,
} from "../../utils/saleModes";
import { type VariantRow } from "../../utils/productEditorForm";

const CELL_INPUT =
  "h-8 w-full rounded-md border border-[#E4E4E7] bg-white px-2 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B] disabled:bg-[#FAFAFA] disabled:text-[#A1A1AA]";

let rowSeq = 0;
/** Khóa tạm cho dòng mới (chưa có id) để React giữ đúng ô nhập khi thêm / xóa */
export const newRowKey = () => `new-${Date.now()}-${(rowSeq += 1)}`;

/** Ký hiệu size của một trục — dùng để sinh tổ hợp */
function axisSizes(axis: SizeAxis): string[] {
  if (axis.kind === "custom") return [CUSTOM_SIZE];
  if (axis.kind === "free") return [FREE_SIZE];
  return axis.sizes;
}

/**
 * SKU của sản phẩm: chọn màu (thuộc tính màu) × size (kế thừa từ bảng size / thuộc tính size) rồi sinh các tổ hợp
 * còn thiếu; mã tự sinh theo <mã SP>-<màu>-<size>, khóa lại để nhập tay khi cần. May đo không có size và không
 * giữ tồn kho; hàng bán theo mét tính tồn bằng mét.
 */
export function ProductSkuField({
  rows,
  onChange,
  productCode,
  axis,
  colors,
  basePrice,
  stockUnit,
}: {
  rows: VariantRow[];
  onChange: (rows: VariantRow[]) => void;
  productCode: string;
  axis: SizeAxis;
  colors: AdminProductAttributeOption[];
  basePrice: number;
  /** "piece" | "meter" | null (may đo — không tồn kho) */
  stockUnit: "piece" | "meter" | null;
}) {
  const t = useTranslations("AdminPage.products.sku");
  const colorById = new Map(colors.map((c) => [c.id, c]));
  const allSizes = axisSizes(axis);
  const [pickedColors, setPickedColors] = useState<Set<string>>(
    () => new Set(rows.flatMap((row) => (row.colorId ? [row.colorId] : [])))
  );
  const [pickedSizes, setPickedSizes] = useState<Set<string>>(() => {
    const used = rows.map((row) => row.size).filter((size) => allSizes.includes(size));
    return new Set(used.length > 0 ? used : allSizes);
  });

  // Trục size đổi (đổi loại / hình thức bán / bảng size): chỉ giữ size còn thuộc trục
  const sizes = allSizes.filter((size) => axis.kind !== "sized" || pickedSizes.has(size));
  const colorChoices = colors.filter((c) => c.isActive || pickedColors.has(c.id));
  const comboColors: (string | null)[] = pickedColors.size > 0 ? [...pickedColors] : [null];
  const existing = new Set(rows.map((row) => comboKey(row.colorId, row.size)));
  const missing = comboColors.flatMap((colorId) =>
    sizes.filter((size) => !existing.has(comboKey(colorId, size))).map((size) => ({ colorId, size }))
  );

  const toggle = (set: Set<string>, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const generate = () =>
    onChange([
      ...rows,
      ...missing.map(({ colorId, size }) => ({
        key: newRowKey(),
        colorId,
        color: colorId ? (colorById.get(colorId)?.name ?? "") : "",
        size,
        skuAuto: true,
        sku: "",
        price: null,
        stock: 0,
        inUse: false,
      })),
    ]);

  const update = (key: string, patch: Partial<VariantRow>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const previewSku = (row: VariantRow) =>
    buildVariantSku({
      productCode,
      colorCode: row.colorId ? (colorById.get(row.colorId)?.code ?? null) : row.color || null,
      size: row.size,
    });

  const sizeLabel = (size: string) => (size === CUSTOM_SIZE ? t("customSize") : size === FREE_SIZE ? t("freeSize") : size);
  const sizeInvalid = (size: string) => !allSizes.includes(size);

  return (
    <div className="space-y-4">
      {/* Bộ sinh tổ hợp màu × size */}
      <div className="space-y-3 rounded-lg border border-dashed border-[#D4D4D8] p-3">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
            {t("colors")}
            <AdminInfoTip content={t("colorsHint")} />
          </p>
          {colorChoices.length === 0 ? (
            <p className="text-xs text-[#A1A1AA]">{t("noColors")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {colorChoices.map((color) => {
                const on = pickedColors.has(color.id);
                return (
                  <button
                    key={color.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPickedColors((prev) => toggle(prev, color.id))}
                    className={cn(
                      "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border pl-1 pr-2.5 text-xs font-medium transition-colors",
                      on ? "border-[#18181B] bg-[#18181B] text-white" : "border-[#E4E4E7] text-[#3F3F46] hover:border-[#A1A1AA]"
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-5 rounded-full border border-black/10"
                      style={{ background: color.hex ?? "#F4F4F5" }}
                    />
                    {color.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {axis.kind === "sized" && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
              {t("sizes")}
              <span className="text-xs font-normal text-[#A1A1AA]">
                {axis.source === "chart" ? t("sizesFromChart") : t("sizesFromAttributes")}
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {axis.sizes.map((size) => {
                const on = pickedSizes.has(size);
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPickedSizes((prev) => toggle(prev, size))}
                    className={cn(
                      "h-7 min-w-10 cursor-pointer rounded-md border px-2 font-mono text-xs font-semibold transition-colors",
                      on ? "border-[#18181B] bg-[#18181B] text-white" : "border-[#E4E4E7] text-[#3F3F46] hover:border-[#A1A1AA]"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-[#E4E4E7] pt-3">
          <p className="text-xs text-[#71717A]">
            {t("rule", { example: buildVariantSku({ productCode, colorCode: colorChoices[0]?.code ?? null, size: allSizes[0] }) })}
          </p>
          <button
            type="button"
            disabled={missing.length === 0}
            onClick={generate}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#18181B] px-3 text-xs font-medium text-white hover:bg-[#09090B] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#A1A1AA]"
          >
            <Sparkles size={13} aria-hidden />
            {missing.length > 0 ? t("generate", { count: missing.length }) : t("allGenerated")}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#71717A]">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-body">
            <thead>
              <tr className="border-b border-[#E4E4E7] text-left text-body font-semibold text-[#3F3F46]">
                <th className="py-2 pr-2">{t("color")}</th>
                <th className="px-2 py-2">{t("size")}</th>
                <th className="px-2 py-2">{t("code")}</th>
                <th className="w-32 px-2 py-2">{t("price")}</th>
                {stockUnit && <th className="w-24 px-2 py-2">{stockUnit === "meter" ? t("stockMeters") : t("stock")}</th>}
                <th className="w-9 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F5]">
              {rows.map((row) => {
                const color = row.colorId ? colorById.get(row.colorId) : null;
                return (
                  <tr key={row.key}>
                    <td className="py-2 pr-2">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        <span
                          aria-hidden
                          className="size-4 shrink-0 rounded-full border border-black/10"
                          style={{ background: color?.hex ?? "#F4F4F5" }}
                        />
                        {color?.name ?? (row.color || <span className="text-[#A1A1AA]">{t("noColor")}</span>)}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          "font-mono text-xs font-semibold",
                          sizeInvalid(row.size) ? "rounded bg-rose-50 px-1 text-rose-700" : "text-[#09090B]"
                        )}
                        title={sizeInvalid(row.size) ? t("sizeInvalid") : undefined}
                      >
                        {sizeLabel(row.size)}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {/* SKU đã lưu giữ nguyên (đã in tem / có đơn) — chỉ dòng mới mới sinh hoặc nhập mã */}
                      {row.id ? (
                        <span className="font-mono text-xs text-[#3F3F46]">{row.sku}</span>
                      ) : (
                      <div className="flex items-center gap-1">
                        {row.skuAuto ? (
                          <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#3F3F46]">
                            {previewSku(row)}
                          </span>
                        ) : (
                          <input
                            value={row.sku}
                            onChange={(e) => update(row.key, { sku: e.target.value.toUpperCase() })}
                            placeholder={t("codePlaceholder")}
                            className={cn(CELL_INPUT, "font-mono text-xs")}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => update(row.key, { skuAuto: !row.skuAuto, sku: row.skuAuto ? row.sku || previewSku(row) : row.sku })}
                          aria-label={row.skuAuto ? t("manual") : t("auto")}
                          title={row.skuAuto ? t("manual") : t("auto")}
                          className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-[#09090B]"
                        >
                          {row.skuAuto ? <Lock size={13} /> : <Unlock size={13} />}
                        </button>
                      </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={row.price ?? ""}
                        onChange={(e) => update(row.key, { price: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))) || null })}
                        placeholder={basePrice > 0 ? basePrice.toLocaleString("vi-VN") : t("basePrice")}
                        aria-label={t("price")}
                        className={cn(CELL_INPUT, "text-right font-mono tabular-nums")}
                      />
                    </td>
                    {stockUnit && (
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          value={row.stock}
                          onChange={(e) => update(row.key, { stock: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                          aria-label={t("stock")}
                          className={cn(CELL_INPUT, "text-right font-mono tabular-nums")}
                        />
                      </td>
                    )}
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        disabled={row.inUse}
                        onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
                        aria-label={t("remove")}
                        title={row.inUse ? t("inUse") : t("remove")}
                        className="grid size-7 cursor-pointer place-items-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
