"use client";

import { Fragment, useMemo, useState } from "react";
import { AlertTriangle, ImagePlus, Lock, Plus, Sparkles, Trash2, Unlock, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_CARD_CLASS,
  AdminButton,
  AdminCheckbox,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminMultiSelect,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { type AdminProductAttributeOption, type ProductColorImage } from "../../types/products.types";
import {
  CUSTOM_SIZE,
  FREE_SIZE,
  buildVariantSku,
  comboKey,
  type SizeAxis,
} from "../../utils/saleModes";
import { type VariantRow } from "../../utils/productEditorForm";
import {
  isDraftProductImage,
  prepareAndCropProductImage,
  registerDraftProductImage,
  revokeDraftProductImage,
} from "../../utils/productImage";

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
  pickedColorIds,
  onPickedColorIdsChange,
  colorImages = [],
  onColorImagesChange,
  primaryColorId,
  onPrimaryColorChange,
  primaryImages = [],
  onPrimaryImagesChange,
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
  pickedColorIds?: string[];
  onPickedColorIdsChange?: (colorIds: string[]) => void;
  colorImages?: ProductColorImage[];
  onColorImagesChange?: (colorImages: ProductColorImage[]) => void;
  primaryColorId?: string | null;
  onPrimaryColorChange?: (colorId: string) => void;
  primaryImages?: string[];
  onPrimaryImagesChange?: (images: string[]) => void;
}) {
  const t = useTranslations("AdminPage.products.sku");
  const tProd = useTranslations("AdminPage.products");
  const tImg = useTranslations("AdminPage.products.image");
  const locale = useLocale();
  const notify = useNotify();

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
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    colorId: string | null;
    imgIndex?: number;
    isPrimary?: boolean;
  } | null>(null);

  const colorById = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors]);
  const allSizes = useMemo(() => axisSizes(axis), [axis]);

  // Xác định các màu sắc có mặt trong danh sách biến thể SKU thực tế
  const distinctColorIdsInRows = useMemo(() => {
    return Array.from(new Set(rows.flatMap((r) => (r.colorId ? [r.colorId] : []))));
  }, [rows]);

  // Màu chính hiệu lực: màu được chọn làm màu chính hoặc màu đầu tiên trong danh sách SKU
  const effectivePrimaryColorId = useMemo(() => {
    if (primaryColorId && distinctColorIdsInRows.includes(primaryColorId)) {
      return primaryColorId;
    }
    return distinctColorIdsInRows[0] ?? null;
  }, [primaryColorId, distinctColorIdsInRows]);

  /** Cập nhật hoặc xóa ảnh cho một ô ảnh của màu phụ */
  const handleUpdateColorSlot = (colorId: string, slotIndex: number, newUrl: string) => {
    if (!onColorImagesChange) return;

    const prevEntry = colorImages.find((ci) => ci.colorId === colorId);
    const prevImgs = prevEntry ? [...prevEntry.images] : [];
    const oldUrl = prevImgs[slotIndex];

    if (!newUrl) {
      if (oldUrl && isDraftProductImage(oldUrl)) {
        revokeDraftProductImage(oldUrl);
      }
      const nextImgs = prevImgs.filter((_, idx) => idx !== slotIndex);
      const nextColorImages = colorImages
        .map((ci) => (ci.colorId === colorId ? { ...ci, images: nextImgs } : ci))
        .filter((ci) => ci.images.length > 0);
      onColorImagesChange(nextColorImages);
      return;
    }

    if (oldUrl && oldUrl !== newUrl && isDraftProductImage(oldUrl)) {
      revokeDraftProductImage(oldUrl);
    }

    const nextImgs = [...prevImgs];
    if (slotIndex < nextImgs.length) {
      nextImgs[slotIndex] = newUrl;
    } else {
      nextImgs.push(newUrl);
    }
    const cappedImgs = nextImgs.slice(0, 2);

    const exists = colorImages.some((ci) => ci.colorId === colorId);
    const nextColorImages = exists
      ? colorImages.map((ci) => (ci.colorId === colorId ? { ...ci, images: cappedImgs } : ci))
      : [...colorImages, { colorId, images: cappedImgs }];

    onColorImagesChange(nextColorImages);
  };

  // Trạng thái chọn Màu & Size trong dropdown
  const [pickedColors, setPickedColors] = useState<Set<string>>(() => {
    const fromVariants = rows.flatMap((row) => (row.colorId ? [row.colorId] : []));
    return new Set(pickedColorIds && pickedColorIds.length > 0 ? pickedColorIds : fromVariants);
  });
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
    onPickedColorIdsChange?.(nextColorIds);
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

  // Nhóm các biến thể theo màu sắc để hiển thị dòng cha
  const colorGroups = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        colorId: string | null;
        colorName: string;
        colorHex: string | null;
        rows: VariantRow[];
      }
    >();

    for (const row of rows) {
      const key = row.colorId ?? "__no_color__";
      const existingGroup = groupsMap.get(key);
      if (existingGroup) {
        existingGroup.rows.push(row);
      } else {
        const colorObj = row.colorId ? colorById.get(row.colorId) : null;
        groupsMap.set(key, {
          colorId: row.colorId,
          colorName: colorObj?.name ?? (row.color || t("noColor")),
          colorHex: colorObj?.hex ?? null,
          rows: [row],
        });
      }
    }

    return Array.from(groupsMap.values()).map((g) => ({
      ...g,
      isPrimary: Boolean(g.colorId && g.colorId === effectivePrimaryColorId),
    }));
  }, [rows, colorById, effectivePrimaryColorId, t]);

  const columnCount = 5 + (stockUnit ? 1 : 0);

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

      {/* Khung bảng danh sách biến thể SKU nhóm theo Màu sắc */}
      <section className={cn(ADMIN_CARD_CLASS, "@container overflow-hidden")}>
        {/* Top Banner */}
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

        {/* Batch action bar khi có dòng được chọn */}
        {selectedIds.size > 0 && (
          <div className="flex h-11 items-center gap-3 border-b border-dashed border-[#E4E4E7] bg-white px-4">
            <span className="flex">
              <AdminCheckbox
                checked={selectedIds.size === rows.length}
                indeterminate={selectedIds.size > 0 && selectedIds.size < rows.length}
                onChange={(checked) => {
                  if (checked) {
                    setSelectedIds(new Set(rows.filter((r) => !r.inUse).map((r) => r.key)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
                label={t("selectAll")}
              />
            </span>
            <span className="mr-auto truncate text-xs font-medium text-[#09090B]">
              {t("selectedCount", { count: selectedIds.size })}
            </span>
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
          </div>
        )}

        {rows.length === 0 ? (
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
        ) : (
          <div className="relative max-h-[480px] overflow-x-auto overflow-y-auto">
            <table className="w-full border-separate border-spacing-0 text-body" style={{ minWidth: 680 }}>
              <thead>
                <tr className="sticky top-0 z-10 h-11 bg-[#FAFAFA] text-xs font-medium text-[#71717A]">
                  <th className="w-12 border-b border-dashed border-[#E4E4E7] bg-[#FAFAFA] pl-4 pr-1 text-left">
                    <span className="flex">
                      <AdminCheckbox
                        checked={selectedIds.size === rows.length && rows.length > 0}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < rows.length}
                        onChange={(checked) => {
                          if (checked) {
                            setSelectedIds(new Set(rows.filter((r) => !r.inUse).map((r) => r.key)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                        label={t("selectAll")}
                      />
                    </span>
                  </th>
                  <th className="w-40 border-b border-dashed border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2.5 text-left text-xs font-medium text-[#71717A]">
                    {t("size")}
                  </th>
                  <th className="min-w-[190px] border-b border-dashed border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2.5 text-left text-xs font-medium text-[#71717A]">
                    {t("code")}
                  </th>
                  <th className="w-36 border-b border-dashed border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2.5 text-right text-xs font-medium text-[#71717A]">
                    {t("price")}
                  </th>
                  {stockUnit && (
                    <th className="w-28 border-b border-dashed border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2.5 text-right text-xs font-medium text-[#71717A]">
                      {stockUnit === "meter" ? t("stockMeters") : t("stock")}
                    </th>
                  )}
                  <th className="w-12 border-b border-dashed border-[#E4E4E7] bg-[#FAFAFA] pl-1 pr-4 text-right">
                    <span className="sr-only">{t("remove")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {colorGroups.map((group) => {
                  const isPrimary = group.isPrimary;
                  const entry = colorImages.find((ci) => ci.colorId === group.colorId);
                  const secondaryImgs = entry?.images ?? [];
                  const primaryCover = primaryImages?.[0];

                  return (
                    <Fragment key={group.colorId ?? "__no_color__"}>
                      {/* Dòng thẻ cha của màu (Parent row) */}
                      <tr className="border-y border-[#E4E4E7] bg-[#FAFAFA]">
                        <td colSpan={columnCount} className="border-t border-b border-[#E4E4E7] px-4 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* Trái: Thông tin màu sắc, nhãn & nút đặt làm màu chính */}
                            <div className="flex items-center gap-2">
                              {group.colorHex && (
                                <span
                                  aria-hidden
                                  className="size-3.5 shrink-0 rounded-full border border-black/15 shadow-2xs"
                                  style={{ background: group.colorHex ?? undefined }}
                                />
                              )}
                              <span className="text-xs font-semibold text-[#09090B]">
                                {group.colorName}
                              </span>

                              {group.colorId && (
                                isPrimary ? (
                                  <span className="rounded bg-[#18181B] px-1.5 py-0.5 text-2xs font-medium text-white shadow-2xs">
                                    {tImg("primaryColorBadge")}
                                  </span>
                                ) : (
                                  <span className="rounded border border-[#E4E4E7] bg-white px-1.5 py-0.5 text-2xs font-medium text-[#71717A] shadow-2xs">
                                    {tImg("secondaryColorBadge")}
                                  </span>
                                )
                              )}

                              <span className="text-2xs text-[#71717A]">
                                ({group.rows.length} {t("size").toLowerCase()})
                              </span>

                              {group.colorId && !isPrimary && onPrimaryColorChange && (
                                <button
                                  type="button"
                                  onClick={() => onPrimaryColorChange(group.colorId!)}
                                  className="cursor-pointer text-2xs text-[#71717A] transition-colors hover:text-[#18181B] hover:underline"
                                >
                                  {tImg("setAsPrimary")}
                                </button>
                              )}
                            </div>

                            {/* Phải: Icon add thêm ảnh vào với màu đó & Thumbnails */}
                            {group.colorId && (
                              <div className="flex items-center gap-2">
                                {isPrimary ? (
                                  <>
                                    {primaryCover && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewImage({
                                            url: primaryCover,
                                            colorId: group.colorId,
                                            imgIndex: 0,
                                            isPrimary: true,
                                          })
                                        }
                                        className="group/photo relative h-8.5 w-6.5 shrink-0 cursor-pointer overflow-hidden rounded border border-[#E4E4E7] bg-white shadow-2xs transition-all hover:scale-105 hover:border-[#18181B]"
                                        title={t("previewPhotoTitle")}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={primaryCover} alt="" className="size-full object-cover" />
                                      </button>
                                    )}
                                    <label
                                      title={primaryCover ? t("addMainAlbumPhotoTitle") : t("addMainCoverPhotoTitle")}
                                      className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-[#D4D4D8] bg-white px-2 text-2xs font-medium text-[#71717A] shadow-2xs transition-all hover:border-[#18181B] hover:bg-[#FAFAFA] hover:text-[#09090B]"
                                    >
                                      <ImagePlus size={13} className="shrink-0 text-[#71717A]" />
                                      <span>{primaryCover ? t("addAlbumPhoto") : t("addPhoto")}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          e.target.value = "";
                                          if (!file) return;
                                          const prepared = await prepareAndCropProductImage(file);
                                          if (!prepared.success) {
                                            notify.error(prepared.error, "IMAGE_UPLOAD_FAILED");
                                            return;
                                          }
                                          const draftUrl = registerDraftProductImage(prepared.file);
                                          onPrimaryImagesChange?.([...(primaryImages ?? []), draftUrl]);
                                        }}
                                      />
                                    </label>
                                  </>
                                ) : (
                                  <>
                                    {secondaryImgs.map((url, imgIndex) => (
                                      <button
                                        key={url}
                                        type="button"
                                        onClick={() =>
                                          setPreviewImage({
                                            url,
                                            colorId: group.colorId,
                                            imgIndex,
                                            isPrimary: false,
                                          })
                                        }
                                        className="group/photo relative h-8.5 w-6.5 shrink-0 cursor-pointer overflow-hidden rounded border border-[#E4E4E7] bg-white shadow-2xs transition-all hover:scale-105 hover:border-[#18181B]"
                                        title={t("previewPhotoTitle")}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="" className="size-full object-cover" />
                                      </button>
                                    ))}

                                    {secondaryImgs.length < 2 && (
                                      <label
                                        title={tImg("add")}
                                        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-[#D4D4D8] bg-white px-2 text-2xs font-medium text-[#71717A] shadow-2xs transition-all hover:border-[#18181B] hover:bg-[#FAFAFA] hover:text-[#09090B]"
                                      >
                                        <ImagePlus size={13} className="shrink-0 text-[#71717A]" />
                                        <span>
                                          {secondaryImgs.length === 0 ? t("addPhoto") : t("addPhotoWithCount", { count: secondaryImgs.length })}
                                        </span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = "";
                                            if (!file) return;
                                            const prepared = await prepareAndCropProductImage(file);
                                            if (!prepared.success) {
                                              notify.error(prepared.error, "IMAGE_UPLOAD_FAILED");
                                              return;
                                            }
                                            const draftUrl = registerDraftProductImage(prepared.file);
                                            handleUpdateColorSlot(group.colorId!, secondaryImgs.length, draftUrl);
                                          }}
                                        />
                                      </label>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Các biến thể size bên dưới dòng thẻ cha */}
                      {group.rows.map((row) => {
                        const isSelected = selectedIds.has(row.key);
                        const isDuplicate = rows.filter((r) => comboKey(r.colorId, r.size) === comboKey(row.colorId, row.size)).length > 1;
                        const isInv = sizeInvalid(row.size);

                        return (
                          <tr
                            key={row.key}
                            data-selected={isSelected || undefined}
                            className="group/row transition-colors hover:bg-[#FAFAFA] data-selected:bg-[#F4F4F5]/70 [&>td]:border-b [&>td]:border-dashed [&>td]:border-[#E4E4E7]"
                          >
                            {/* Checkbox */}
                            <td className="py-2.5 pl-4 pr-1">
                              <span className="flex">
                                <AdminCheckbox
                                  checked={isSelected}
                                  onChange={(checked) => {
                                    setSelectedIds((prev) => {
                                      const next = new Set(prev);
                                      if (checked) next.add(row.key);
                                      else next.delete(row.key);
                                      return next;
                                    });
                                  }}
                                  label={t("selectVariant", { size: row.size })}
                                  disabled={row.inUse}
                                />
                              </span>
                            </td>

                            {/* Kích cỡ */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2 pl-2">
                                <span className="text-xs text-[#A1A1AA]">↳</span>
                                {row.id || axis.kind !== "sized" ? (
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
                                ) : (
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
                                )}
                              </div>
                            </td>

                            {/* Mã SKU */}
                            <td className="py-2.5 px-3">
                              {row.id ? (
                                <span className="font-mono text-xs font-medium text-[#3F3F46]">{row.sku}</span>
                              ) : (
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
                                      className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-[#A1A1AA] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
                                    >
                                      {row.skuAuto ? <Lock size={13} /> : <Unlock size={13} />}
                                    </button>
                                  </AdminTooltip>
                                </div>
                              )}
                            </td>

                            {/* Giá riêng */}
                            <td className="py-2.5 px-3 text-right">
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
                            </td>

                            {/* Tồn kho (nếu có đơn vị tồn kho) */}
                            {stockUnit && (
                              <td className="py-2.5 px-3 text-right">
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
                              </td>
                            )}

                            {/* Thao tác xóa biến thể */}
                            <td className="py-2.5 pl-1 pr-4 text-right">
                              <AdminTooltip content={row.inUse ? t("inUse") : t("remove")}>
                                <span className="inline-grid" tabIndex={row.inUse ? 0 : undefined}>
                                  <button
                                    type="button"
                                    disabled={row.inUse}
                                    onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
                                    aria-label={t("remove")}
                                    className="grid size-7 cursor-pointer place-items-center rounded-md text-[#A1A1AA] transition-colors hover:bg-[#F4F4F5] hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </span>
                              </AdminTooltip>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}

                {/* Hàng thêm dòng mới ở cuối bảng */}
                <tr className="group/add-row">
                  <td
                    colSpan={columnCount}
                    className="border-t border-dashed border-[#E4E4E7] p-2"
                  >
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4D4D8] bg-white py-2 text-xs font-medium text-[#71717A] transition-all hover:border-[#18181B] hover:bg-[#FAFAFA] hover:text-[#09090B] active:bg-[#F4F4F5]"
                    >
                      <Plus size={14} className="shrink-0 text-[#71717A] group-hover/add-row:text-[#09090B]" />
                      <span>{t("addSingleSku")}</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Dialog xem ảnh chi tiết khi click vào ảnh nhỏ */}
      {previewImage && (
        <AdminDialog
          open={Boolean(previewImage)}
          onOpenChange={(open) => {
            if (!open) setPreviewImage(null);
          }}
          title={<span className="sr-only">{t("previewColorImage")}</span>}
          bare
          disableDivider
          size="sm"
          className="max-w-[340px] overflow-hidden rounded-2xl sm:max-w-[400px] [&>header]:hidden"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#F4F4F5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt=""
              className="size-full select-none object-cover"
            />

            {/* Góc trên bên trái: Tag trạng thái Nháp */}
            {isDraftProductImage(previewImage.url) && (
              <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-amber-500/95 px-2 py-0.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs">
                {t("draft")}
              </span>
            )}

            {/* Góc trên bên phải: Icon thùng rác xóa ảnh và nút Đóng */}
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
              <button
                type="button"
                title={t("removePhoto")}
                aria-label={t("removePhoto")}
                onClick={() => {
                  if (previewImage.isPrimary) {
                    onPrimaryImagesChange?.((primaryImages ?? []).filter((_, idx) => idx !== 0));
                  } else if (previewImage.colorId && typeof previewImage.imgIndex === "number") {
                    handleUpdateColorSlot(previewImage.colorId, previewImage.imgIndex, "");
                  }
                  setPreviewImage(null);
                }}
                className="grid size-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-xs transition-colors hover:bg-rose-600 focus-visible:outline-none"
              >
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                title={t("close")}
                aria-label={t("close")}
                onClick={() => setPreviewImage(null)}
                className="grid size-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-xs transition-colors hover:bg-black/80 focus-visible:outline-none"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
