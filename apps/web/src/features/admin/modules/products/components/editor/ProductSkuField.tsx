"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Lock, Plus, Sparkles, Trash2, Unlock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  AdminButton,
  AdminDataTable,
  AdminFilterSelect,
  AdminInfoTip,
  AdminSwitch,
  AdminTextField,
  AdminTooltip,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
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
  "h-8.5 w-full rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs text-[#09090B] shadow-2xs outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#A1A1AA] hover:border-[#D4D4D8] focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/10 disabled:cursor-not-allowed disabled:bg-[#FAFAFA] disabled:text-[#71717A]";

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
 * SKU của sản phẩm:
 * - Bố cục 2 cột chuẩn mực: Cột trái nhãn thông tin + hướng dẫn, cột phải lựa chọn (Màu sắc, Size).
 * - Phía dưới có công tắc (switch) chuyển đổi chế độ thêm (Sinh tự động hoặc Thêm thủ công).
 * - Bảng danh sách biến thể dùng AdminDataTable, hỗ trợ chỉnh sửa trực tiếp (Màu, Size, Mã, Giá, Tồn kho).
 */
export function ProductSkuField({
  rows,
  onChange,
  productCode,
  axis,
  colors,
  basePrice,
  onBasePriceChange,
  stockUnit,
  totalStock,
}: {
  rows: VariantRow[];
  onChange: (rows: VariantRow[]) => void;
  productCode: string;
  axis: SizeAxis;
  colors: AdminProductAttributeOption[];
  basePrice: number;
  onBasePriceChange?: (price: number) => void;
  /** "piece" | "meter" | null (may đo — không tồn kho) */
  stockUnit: "piece" | "meter" | null;
  totalStock?: number;
}) {
  const t = useTranslations("AdminPage.products.sku");
  const tProd = useTranslations("AdminPage.products");
  const locale = useLocale();

  const [isAutoMode, setIsAutoMode] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const colorById = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors]);
  const allSizes = useMemo(() => axisSizes(axis), [axis]);

  // Trạng thái chọn Màu & Size
  const [pickedColors, setPickedColors] = useState<Set<string>>(
    () => new Set(rows.flatMap((row) => (row.colorId ? [row.colorId] : [])))
  );
  const [pickedSizes, setPickedSizes] = useState<Set<string>>(() => {
    const used = rows.map((row) => row.size).filter((size) => allSizes.includes(size));
    return new Set(used.length > 0 ? used : allSizes);
  });

  const sizes = allSizes.filter((size) => axis.kind !== "sized" || pickedSizes.has(size));
  const colorChoices = colors.filter((c) => c.isActive || pickedColors.has(c.id));
  const comboColors: (string | null)[] = pickedColors.size > 0 ? [...pickedColors] : [null];
  const existing = useMemo(() => new Set(rows.map((row) => comboKey(row.colorId, row.size))), [rows]);
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

  const sizeLabel = (size: string) =>
    size === CUSTOM_SIZE ? t("customSize") : size === FREE_SIZE ? t("freeSize") : size;
  const sizeInvalid = (size: string) => !allSizes.includes(size);

  const handleAddRow = () => {
    const availableColor =
      colorChoices.find((c) => !existing.has(comboKey(c.id, allSizes[0] ?? ""))) ?? colorChoices[0];
    const newVariant: VariantRow = {
      key: newRowKey(),
      colorId: availableColor?.id ?? null,
      color: availableColor?.name ?? "",
      size: allSizes[0] ?? "",
      skuAuto: true,
      sku: "",
      price: null,
      stock: 0,
      inUse: false,
    };
    onChange([...rows, newVariant]);
  };

  const columns: AdminTableColumn<VariantRow>[] = useMemo(
    () => [
      {
        key: "color",
        header: t("color"),
        className: "w-48",
        cell: (row) => {
          const color = row.colorId ? colorById.get(row.colorId) : null;
          if (row.id) {
            return (
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <span
                  aria-hidden
                  className="size-3.5 shrink-0 rounded-full border border-black/15 shadow-2xs"
                  style={{ background: color?.hex ?? "#F4F4F5" }}
                />
                <span className="text-sm font-medium text-[#09090B]">
                  {color?.name ?? (row.color || <span className="text-[#A1A1AA]">{t("noColor")}</span>)}
                </span>
              </span>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-3.5 shrink-0 rounded-full border border-black/15 shadow-2xs"
                style={{ background: color?.hex ?? "#F4F4F5" }}
              />
              <div className="min-w-0 flex-1">
                <AdminFilterSelect
                  value={row.colorId ?? ""}
                  options={[
                    { value: "", label: t("noColor") },
                    ...colorChoices.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  onChange={(colorId) => {
                    const nextColor = colorId ? colorById.get(colorId) : null;
                    update(row.key, {
                      colorId: colorId || null,
                      color: nextColor ? nextColor.name : "",
                    });
                  }}
                  className="h-8.5 w-full text-xs"
                />
              </div>
            </div>
          );
        },
      },
      {
        key: "size",
        header: t("size"),
        className: "w-32",
        cell: (row) => {
          const isDuplicate =
            rows.filter((r) => comboKey(r.colorId, r.size) === comboKey(row.colorId, row.size)).length > 1;
          const isInv = sizeInvalid(row.size);

          if (row.id || axis.kind !== "sized") {
            return (
              <div className="flex items-center gap-1.5">
                <AdminTooltip content={isInv ? t("sizeInvalid") : isDuplicate ? t("duplicateVariantError") : null}>
                  <span
                    className={cn(
                      "font-mono text-sm font-semibold",
                      isInv || isDuplicate ? "rounded bg-rose-50 px-1 text-rose-700" : "text-[#09090B]"
                    )}
                  >
                    {sizeLabel(row.size)}
                  </span>
                </AdminTooltip>
                {isDuplicate && (
                  <AdminTooltip content={t("duplicateVariantError")}>
                    <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                  </AdminTooltip>
                )}
              </div>
            );
          }
          return (
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <AdminFilterSelect
                  value={row.size}
                  options={allSizes.map((s) => ({ value: s, label: sizeLabel(s) }))}
                  onChange={(size) => update(row.key, { size })}
                  invalid={isDuplicate || isInv}
                  className="h-8.5 w-full font-mono text-xs"
                />
              </div>
              {isDuplicate && (
                <AdminTooltip content={t("duplicateVariantError")}>
                  <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                </AdminTooltip>
              )}
            </div>
          );
        },
      },
      {
        key: "sku",
        header: t("code"),
        className: "min-w-[190px]",
        cell: (row) => {
          if (row.id) {
            return <span className="font-mono text-xs font-medium text-[#3F3F46]">{row.sku}</span>;
          }
          return (
            <div className="flex items-center gap-1.5">
              {row.skuAuto ? (
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#71717A]">
                  {previewSku(row)}
                </span>
              ) : (
                <input
                  value={row.sku}
                  onChange={(e) => update(row.key, { sku: e.target.value.toUpperCase() })}
                  placeholder={t("codePlaceholder")}
                  className={cn(CELL_INPUT, "font-mono")}
                />
              )}
              <AdminTooltip content={row.skuAuto ? t("manual") : t("auto")}>
                <button
                  type="button"
                  onClick={() =>
                    update(row.key, {
                      skuAuto: !row.skuAuto,
                      sku: row.skuAuto ? row.sku || previewSku(row) : row.sku,
                    })
                  }
                  aria-label={row.skuAuto ? t("manual") : t("auto")}
                  className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-[#09090B] transition-colors"
                >
                  {row.skuAuto ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
              </AdminTooltip>
            </div>
          );
        },
      },
      {
        key: "price",
        header: t("price"),
        className: "w-36",
        cell: (row) => (
          <input
            type="number"
            min={0}
            step={10000}
            value={row.price ?? ""}
            onChange={(e) =>
              update(row.key, {
                price: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))) || null,
              })
            }
            placeholder={basePrice > 0 ? basePrice.toLocaleString("vi-VN") : t("basePrice")}
            aria-label={t("price")}
            className={cn(CELL_INPUT, "text-right font-mono tabular-nums")}
          />
        ),
      },
      ...(stockUnit
        ? [
            {
              key: "stock",
              header: stockUnit === "meter" ? t("stockMeters") : t("stock"),
              className: "w-28",
              cell: (row: VariantRow) => (
                <input
                  type="number"
                  min={0}
                  value={row.stock}
                  onChange={(e) =>
                    update(row.key, { stock: Math.max(0, Math.round(Number(e.target.value) || 0)) })
                  }
                  aria-label={t("stock")}
                  className={cn(CELL_INPUT, "text-right font-mono tabular-nums")}
                />
              ),
            },
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dependencies
    [rows, colorChoices, allSizes, axis, basePrice, stockUnit, t]
  );

  return (
    <div className="space-y-6">
      {/* 4 hàng cấu hình đồng bộ: Giá bán niêm yết, Màu sắc, Kích cỡ, Cách tạo SKU */}
      <div className="space-y-4.5">
        {/* Hàng 1: Giá bán niêm yết */}
        <div className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)] gap-3 sm:gap-6 items-start">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#09090B]">
                {tProd("field.basePrice")} <span className="text-rose-500">*</span>
              </span>
              <AdminInfoTip content={tProd("hints.basePriceExplain")} />
            </div>
            <p className="text-xs text-[#71717A] leading-relaxed">
              {tProd("hints.basePriceExplain")}
            </p>
          </div>

          <div className="w-full max-w-xs">
            <AdminTextField
              required
              mask="currency"
              currencyOptions={{ thousandSeparator: locale === "vi" ? "." : "," }}
              value={basePrice ? String(basePrice) : ""}
              onValueChange={(_display, raw) =>
                onBasePriceChange?.(Math.max(0, Math.round(Number(raw) || 0)))
              }
              placeholder={tProd("placeholders.basePrice")}
              suffix={<span className="text-xs font-medium text-[#71717A]">₫</span>}
              inputClassName="font-mono tabular-nums text-right font-semibold"
            />
          </div>
        </div>

        {/* Hàng 2: Màu sắc */}
        <div className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)] gap-3 sm:gap-6 items-start border-t border-dashed border-[#E4E4E7] pt-4.5">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#09090B]">
                {t("colors")}
              </span>
              {pickedColors.size > 0 && (
                <span className="rounded-full bg-[#18181B] px-1.5 py-0.5 text-3xs font-medium text-white">
                  {t("colorsPicked", { count: pickedColors.size })}
                </span>
              )}
              <AdminInfoTip content={t("colorsHint")} />
            </div>
            <p className="text-xs text-[#71717A] leading-relaxed">{t("colorsHint")}</p>
            {colorChoices.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5 text-2xs">
                <button
                  type="button"
                  onClick={() => setPickedColors(new Set(colorChoices.map((c) => c.id)))}
                  className="cursor-pointer text-[#71717A] hover:text-[#09090B] hover:underline"
                >
                  {t("selectAll")}
                </button>
                <span className="text-[#D4D4D8]">·</span>
                <button
                  type="button"
                  onClick={() => setPickedColors(new Set())}
                  className="cursor-pointer text-[#71717A] hover:text-[#09090B] hover:underline"
                >
                  {t("deselectAll")}
                </button>
              </div>
            )}
          </div>

          <div className="min-w-0">
            {colorChoices.length === 0 ? (
              <p className="py-1 text-xs text-[#A1A1AA]">{t("noColors")}</p>
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
                        "inline-flex h-7.5 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-all",
                        on
                          ? "border-[#18181B] bg-white font-medium text-[#09090B] shadow-2xs ring-1 ring-[#18181B]"
                          : "border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#A1A1AA] hover:text-[#09090B]"
                      )}
                    >
                      <span
                        aria-hidden
                        className="size-3 shrink-0 rounded-full border border-black/15 shadow-2xs"
                        style={{ background: color.hex ?? "#F4F4F5" }}
                      />
                      <span className="truncate">{color.name}</span>
                      {on && <Check size={11} className="shrink-0 text-[#18181B]" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hàng 3: Kích cỡ (Size) */}
        <div className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)] gap-3 sm:gap-6 items-start border-t border-dashed border-[#E4E4E7] pt-4.5">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#09090B]">
                {t("sizes")}
              </span>
              {axis.kind === "sized" && pickedSizes.size > 0 && (
                <span className="rounded-full bg-[#18181B] px-1.5 py-0.5 text-3xs font-medium text-white">
                  {t("sizesPicked", { count: pickedSizes.size })}
                </span>
              )}
            </div>
            <p className="text-xs text-[#71717A] leading-relaxed">
              {axis.kind === "sized"
                ? axis.source === "chart"
                  ? t("sizesFromChart")
                  : t("sizesFromAttributes")
                : axis.kind === "custom"
                  ? (stockUnit === null ? tProd("options.unitCustom") : t("customSize"))
                  : t("freeSize")}
            </p>
            {axis.kind === "sized" && (
              <div className="flex items-center gap-1.5 pt-0.5 text-2xs">
                <button
                  type="button"
                  onClick={() => setPickedSizes(new Set(axis.sizes))}
                  className="cursor-pointer text-[#71717A] hover:text-[#09090B] hover:underline"
                >
                  {t("selectAll")}
                </button>
                <span className="text-[#D4D4D8]">·</span>
                <button
                  type="button"
                  onClick={() => setPickedSizes(new Set())}
                  className="cursor-pointer text-[#71717A] hover:text-[#09090B] hover:underline"
                >
                  {t("deselectAll")}
                </button>
              </div>
            )}
          </div>

          <div className="min-w-0">
            {axis.kind === "sized" ? (
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
                        "h-7.5 min-w-8.5 cursor-pointer rounded-lg border px-2.5 font-mono text-xs transition-all",
                        on
                          ? "border-[#18181B] bg-[#18181B] font-semibold text-white shadow-xs"
                          : "border-[#E4E4E7] bg-white font-medium text-[#3F3F46] hover:border-[#A1A1AA] hover:text-[#09090B]"
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1 text-xs text-[#71717A]">
                <span className="font-semibold text-[#09090B]">{sizeLabel(allSizes[0] ?? "")}</span>
                <span className="text-2xs text-[#A1A1AA]">
                  ({axis.kind === "custom" ? t("customSize") : t("freeSize")})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hàng 4: Cách tạo SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)] gap-3 sm:gap-6 items-center border-t border-dashed border-[#E4E4E7] pt-4.5">
          <div className="min-w-0 space-y-0.5">
            <span className="text-xs font-semibold text-[#09090B]">
              {t("creationModeLabel")}
            </span>
            <p className="text-xs text-[#71717A] leading-relaxed">
              {isAutoMode ? t("modeAutoDesc") : t("modeManualDesc")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Cụm switch chuyển chế độ */}
            <div className="flex items-center gap-3">
              <AdminSwitch
                checked={isAutoMode}
                onChange={setIsAutoMode}
                label={t("creationModeLabel")}
              />
              <span className="text-xs font-medium text-[#09090B]">
                {isAutoMode ? t("modeAuto") : t("modeManual")}
              </span>
            </div>

            {/* Thao tác tương ứng với chế độ */}
            {isAutoMode ? (
              <div className="flex flex-wrap items-center gap-3">
                {pickedColors.size > 0 && sizes.length > 0 && (
                  <span className="hidden md:inline-block font-mono text-2xs text-[#71717A]">
                    {t("comboSummary", {
                      colors: pickedColors.size,
                      sizes: sizes.length,
                      total: pickedColors.size * sizes.length,
                    })}
                  </span>
                )}
                <AdminButton
                  variant="primary"
                  size="sm"
                  disabled={missing.length === 0}
                  onClick={generate}
                  icon={<Sparkles size={13} className="shrink-0" />}
                  className="shrink-0 whitespace-nowrap"
                >
                  {missing.length > 0 ? t("generate", { count: missing.length }) : t("allGenerated")}
                </AdminButton>
              </div>
            ) : (
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={handleAddRow}
                icon={<Plus size={14} className="shrink-0" />}
                className="shrink-0 whitespace-nowrap"
              >
                {t("addVariant")}
              </AdminButton>
            )}
          </div>
        </div>
      </div>

      {/* Bảng danh sách biến thể SKU dùng AdminDataTable chuẩn */}
      <AdminDataTable<VariantRow>
        rows={rows}
        columns={columns}
        getRowId={(row) => row.key}
        topBanner={
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E4E7] bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#09090B]">{t("tableTitle")}</span>
              <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 font-mono text-xs font-semibold text-[#3F3F46]">
                {rows.length}
              </span>
              {stockUnit !== null && typeof totalStock === "number" && (
                <span className="text-xs text-[#71717A]">
                  · {stockUnit === "meter" ? `${totalStock} ${tProd("options.unitMeter")}` : `${totalStock} ${tProd("options.unitPiece")}`} {t("stock").toLowerCase()}
                </span>
              )}
            </div>
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={handleAddRow}
              icon={<Plus size={14} className="shrink-0" />}
              className="shrink-0 whitespace-nowrap"
            >
              {t("addSingleSku")}
            </AdminButton>
          </div>
        }
        selection={
          rows.length > 0
            ? {
                selectedIds,
                onChange: setSelectedIds,
                selectAllLabel: t("selectAll"),
                rowLabel: (row) => `${row.color || t("noColor")} · ${sizeLabel(row.size)}`,
                summary: (count) => t("selectedCount", { count }),
                actions: (
                  <AdminButton
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      onChange(rows.filter((r) => !selectedIds.has(r.key) || r.inUse));
                      setSelectedIds(new Set());
                    }}
                    icon={<Trash2 size={13} className="shrink-0" />}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {t("deleteSelected")}
                  </AdminButton>
                ),
              }
            : undefined
        }
        rowActions={(row) => (
          <AdminTooltip content={row.inUse ? t("inUse") : t("remove")}>
            <span className="inline-grid" tabIndex={row.inUse ? 0 : undefined}>
              <button
                type="button"
                disabled={row.inUse}
                onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
                aria-label={t("remove")}
                className="grid size-7 cursor-pointer place-items-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </span>
          </AdminTooltip>
        )}
        actionsLabel={t("remove")}
        minWidth={680}
        empty={
          <div className="py-10 text-center text-xs text-[#71717A]">
            <p className="font-medium text-[#09090B]">{t("empty")}</p>
            <div className="mt-3 flex justify-center">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={handleAddRow}
                icon={<Plus size={14} className="shrink-0" />}
                className="shrink-0 whitespace-nowrap"
              >
                {t("addSingleSku")}
              </AdminButton>
            </div>
          </div>
        }
      />
    </div>
  );
}
