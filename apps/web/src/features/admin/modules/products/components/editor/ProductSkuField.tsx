"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Lock, Plus, Sparkles, Trash2, Unlock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  AdminButton,
  AdminDataTable,
  AdminField,
  AdminFilterSelect,
  AdminMultiSelect,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
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

/** Tỷ giá tham chiếu chuẩn quy đổi VND ↔ USD cho hiển thị và nhập liệu (1 USD = 25.000 VNĐ) */
const VND_PER_USD = 25_000;

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
 * - Hàng 1 chia 50 / 50: Giá bán niêm yết (50%) và Màu sắc (50%, Multi-select).
 * - Hàng 2 chia 50 / 50: Kích cỡ (50%, Multi-select) và Nút tạo SKU (50%, Sinh tổ hợp theo yêu cầu).
 * - Người dùng bấm nút "Sinh SKU" để tạo các biến thể vào bảng, không tự động add khi chọn.
 * - Bảng danh sách biến thể dùng AdminDataTable, hỗ trợ thêm biến thể lẻ và chỉnh sửa trực tiếp.
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
  lang,
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
  lang?: AdminContentLang;
}) {
  const t = useTranslations("AdminPage.products.sku");
  const tProd = useTranslations("AdminPage.products");
  const locale = useLocale();

  // Ngôn ngữ áp dụng cho nhập liệu tiền tệ: ưu tiên lang của form biên tập, fallback sang locale hệ thống
  const activeLang = lang ?? (locale === "en" ? "en" : "vi");

  // Quản lý ghi đè tiền tệ thủ công (khi người dùng bấm nút [VNĐ | USD])
  const [userCurrencyOverride, setUserCurrencyOverride] = useState<"VND" | "USD" | null>(null);
  const [prevLang, setPrevLang] = useState(activeLang);

  // Khi người dùng chuyển tab ngôn ngữ VI/EN trên thanh công cụ, đặt lại chế độ ghi đè thủ công
  if (activeLang !== prevLang) {
    setPrevLang(activeLang);
    setUserCurrencyOverride(null);
  }

  const currencyMode: "VND" | "USD" = userCurrencyOverride ?? (activeLang === "en" ? "USD" : "VND");

  // Lưu trữ chuỗi nhập USD gần nhất do người dùng tự gõ để bảo toàn dấu chấm thập phân / số 0 phía sau
  const [userUsdInput, setUserUsdInput] = useState<{ vnd: number; text: string } | null>(null);

  // Chuỗi hiển thị cho USD: nếu người dùng đang gõ thì ưu tiên chuỗi gõ, ngược lại quy đổi từ basePrice
  const usdRaw =
    userUsdInput && userUsdInput.vnd === basePrice
      ? userUsdInput.text
      : basePrice > 0
        ? String(Math.round((basePrice / VND_PER_USD) * 100) / 100)
        : "";

  const handleToggleCurrency = (mode: "VND" | "USD") => {
    setUserCurrencyOverride(mode);
    if (mode === "USD") {
      setUserUsdInput(null);
    }
  };

  // Giá quy đổi ước tính hiển thị cạnh nhãn
  const equivalentPriceText = useMemo(() => {
    if (!basePrice || basePrice <= 0) return null;
    if (currencyMode === "VND") {
      const usdEstimate = basePrice / VND_PER_USD;
      const formattedUsd = usdEstimate.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      return `≈ $${formattedUsd} USD`;
    }
    return `≈ ${basePrice.toLocaleString("vi-VN")} ₫`;
  }, [basePrice, currencyMode]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const colorById = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors]);
  const allSizes = useMemo(() => axisSizes(axis), [axis]);

  // Trạng thái chọn Màu & Size trong dropdown
  const [pickedColors, setPickedColors] = useState<Set<string>>(
    () => new Set(rows.flatMap((row) => (row.colorId ? [row.colorId] : [])))
  );
  const [pickedSizes, setPickedSizes] = useState<Set<string>>(() => {
    const used = rows.map((row) => row.size).filter((size) => allSizes.includes(size));
    return new Set(used.length > 0 ? used : allSizes);
  });

  const sizes = useMemo(
    () => allSizes.filter((size) => axis.kind !== "sized" || pickedSizes.has(size)),
    [allSizes, axis.kind, pickedSizes]
  );
  const colorChoices = useMemo(
    () => colors.filter((c) => c.isActive || pickedColors.has(c.id)),
    [colors, pickedColors]
  );

  const comboColors: (string | null)[] = pickedColors.size > 0 ? [...pickedColors] : [null];
  const existing = useMemo(() => new Set(rows.map((row) => comboKey(row.colorId, row.size))), [rows]);
  const missing = useMemo(
    () =>
      comboColors.flatMap((colorId) =>
        sizes.filter((size) => !existing.has(comboKey(colorId, size))).map((size) => ({ colorId, size }))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- comboColors phụ thuộc pickedColors
    [pickedColors, sizes, existing]
  );

  /** Cập nhật danh sách màu đã chọn */
  const handleColorsChange = (nextColorIds: string[]) => {
    setPickedColors(new Set(nextColorIds));
  };

  /** Cập nhật danh sách kích cỡ đã chọn */
  const handleSizesChange = (nextSizes: string[]) => {
    setPickedSizes(new Set(nextSizes));
  };

  /** Sinh các dòng SKU cho các tổ hợp màu & size còn thiếu */
  const generate = () => {
    if (missing.length === 0) return;
    const newRows: VariantRow[] = missing.map(({ colorId, size }) => ({
      key: newRowKey(),
      colorId,
      color: colorId ? (colorById.get(colorId)?.name ?? "") : "",
      size,
      skuAuto: true,
      sku: "",
      price: null,
      stock: 0,
      inUse: false,
    }));
    onChange([...rows, ...newRows]);
  };

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
            placeholder={
              basePrice > 0
                ? currencyMode === "USD"
                  ? `$${(basePrice / VND_PER_USD).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                  : `${basePrice.toLocaleString("vi-VN")} ₫`
                : t("basePrice")
            }
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
    [rows, colorChoices, allSizes, axis, basePrice, currencyMode, stockUnit, t]
  );

  return (
    <div className="space-y-6">
      {/* 2 hàng 50 / 50 kéo dài bằng nhau tăm tắp */}
      <div className="space-y-4">
        {/* Hàng 1 chia 50 / 50: Giá bán niêm yết (50%) & Màu sắc (50%) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Cột 1: Giá bán niêm yết */}
          <AdminTextField
            label={
              <span className="flex items-center justify-between gap-1.5 w-full">
                <span>{tProd("field.basePrice")}</span>
                {equivalentPriceText && (
                  <span className="text-2xs font-normal text-[#71717A] tabular-nums">
                    {equivalentPriceText}
                  </span>
                )}
              </span>
            }
            required
            mask="currency"
            currencyOptions={
              currencyMode === "USD"
                ? { thousandSeparator: ",", decimalScale: 2 }
                : { thousandSeparator: ".", decimalScale: 0 }
            }
            value={currencyMode === "USD" ? usdRaw : basePrice > 0 ? String(basePrice) : ""}
            onValueChange={(_display, raw) => {
              if (currencyMode === "USD") {
                const usdNum = parseFloat(raw);
                const vnd = Number.isFinite(usdNum) ? Math.max(0, Math.round(usdNum * VND_PER_USD)) : 0;
                setUserUsdInput({ vnd, text: raw });
                onBasePriceChange?.(vnd);
              } else {
                setUserUsdInput(null);
                const vnd = Math.max(0, Math.round(Number(raw) || 0));
                onBasePriceChange?.(vnd);
              }
            }}
            placeholder={currencyMode === "USD" ? "0.00" : "0"}
            prefix={
              <span className="text-xs font-medium text-[#71717A]">
                {currencyMode === "USD" ? "$" : "₫"}
              </span>
            }
            suffix={
              <div className="flex items-center gap-0.5 rounded-lg border border-[#E4E4E7] bg-[#F4F4F5] p-0.5 text-2xs">
                <button
                  type="button"
                  onClick={() => handleToggleCurrency("VND")}
                  className={cn(
                    "cursor-pointer rounded-md px-1.5 py-0.5 font-medium transition-all",
                    currencyMode === "VND"
                      ? "bg-white font-semibold text-[#09090B] shadow-2xs"
                      : "text-[#71717A] hover:text-[#09090B]"
                  )}
                >
                  VNĐ
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleCurrency("USD")}
                  className={cn(
                    "cursor-pointer rounded-md px-1.5 py-0.5 font-medium transition-all",
                    currencyMode === "USD"
                      ? "bg-white font-semibold text-[#09090B] shadow-2xs"
                      : "text-[#71717A] hover:text-[#09090B]"
                  )}
                >
                  USD
                </button>
              </div>
            }
            inputClassName="text-left font-normal text-sm text-[#09090B] tabular-nums"
          />

          {/* Cột 2: Màu sắc (Multi-select dropdown) */}
          <AdminField
            label={t("colors")}
          >
            <AdminMultiSelect
              value={[...pickedColors]}
              options={colorChoices.map((c) => ({
                value: c.id,
                label: c.name,
                colorHex: c.hex,
              }))}
              onChange={handleColorsChange}
              placeholder={t("selectColorsPlaceholder")}
              selectAllText={t("selectAll")}
              deselectAllText={t("deselectAll")}
              summaryFormatter={(count) => t("colorsPicked", { count })}
            />
          </AdminField>
        </div>

        {/* Hàng 2 chia 50 / 50: Kích cỡ (50%) & Nút tạo SKU (50%) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Cột 1: Kích cỡ (Multi-select dropdown) */}
          <AdminField
            label={t("sizes")}
            // hint={
            //   axis.kind === "sized"
            //     ? axis.source === "chart"
            //       ? t("sizesFromChart")
            //       : t("sizesFromAttributes")
            //     : axis.kind === "custom"
            //       ? (stockUnit === null ? tProd("options.unitCustom") : t("customSize"))
            //       : t("freeSize")
            // }
          >
            {axis.kind === "sized" ? (
              <AdminMultiSelect
                value={[...pickedSizes]}
                options={axis.sizes.map((s) => ({
                  value: s,
                  label: s,
                }))}
                onChange={handleSizesChange}
                placeholder={t("selectSizesPlaceholder")}
                selectAllText={t("selectAll")}
                deselectAllText={t("deselectAll")}
                summaryFormatter={(count) => t("sizesPicked", { count })}
              />
            ) : (
              <div className="flex h-10 w-full items-center justify-between rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] px-3 text-xs">
                <span className="font-semibold text-[#09090B]">{sizeLabel(allSizes[0] ?? "")}</span>
                <span className="text-2xs text-[#71717A]">
                  ({axis.kind === "custom" ? t("customSize") : t("freeSize")})
                </span>
              </div>
            )}
          </AdminField>

          {/* Cột 2: Nút tạo biến thể SKU */}
          <AdminField
            label={t("generateSkuAction")}
          >
            <div className="flex h-10 items-center gap-2.5">
              <AdminButton
                variant="primary"
                size="md"
                disabled={missing.length === 0}
                onClick={generate}
                icon={<Sparkles size={13} className="shrink-0" />}
                className="whitespace-nowrap"
              >
                {missing.length > 0 ? t("generate", { count: missing.length }) : t("allGenerated")}
              </AdminButton>

              {missing.length > 0 && pickedColors.size > 0 && sizes.length > 0 && (
                <span className="truncate text-xs text-[#71717A]">
                  ({t("comboSummary", {
                    colors: pickedColors.size,
                    sizes: sizes.length,
                    total: missing.length,
                  })})
                </span>
              )}
            </div>
          </AdminField>
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
          </div>
        }
        maxHeight="max-h-[380px]"
        appendRow={
          <tr className="group/add-row">
            <td
              colSpan={columns.length + 2}
              className="p-2 border-t border-dashed border-[#E4E4E7]"
            >
              <button
                type="button"
                onClick={handleAddRow}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4D4D8] bg-white py-2 text-xs font-medium text-[#71717A] transition-all hover:border-[#18181B] hover:text-[#09090B] hover:bg-[#FAFAFA] active:bg-[#F4F4F5]"
              >
                <Plus size={14} className="shrink-0 text-[#71717A] group-hover/add-row:text-[#09090B]" />
                <span>{t("addSingleSku")}</span>
              </button>
            </td>
          </tr>
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
