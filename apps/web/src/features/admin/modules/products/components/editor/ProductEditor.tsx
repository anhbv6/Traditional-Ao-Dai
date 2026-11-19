"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Boxes, Check, ExternalLink, Plus, Ruler, Scissors, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PRODUCT_GROUP_TRAITS } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  AdminDetailHeader,
  AdminField,
  AdminFilterSelect,
  AdminInfoTip,
  AdminLangSwitch,
  AdminNoticeHint,
  AdminStatusText,
  AdminSwitch,
  AdminTabs,
  AdminTabsContent,
  AdminTabsList,
  AdminTabsTrigger,
  AdminTextArea,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
  type AdminNotice,
} from "@/features/admin/core/ui";
import { updateProductAction } from "../../actions/products.actions";
import { type AdminProductDetail, type AdminProductEditorOptions } from "../../types/products.types";
import { toFormState, toPayload, type ProductFormState } from "../../utils/productEditorForm";
import { getActivationIssues, hasDuplicateVariant, MIN_IMAGES_TO_ACTIVATE } from "../../utils/products.utils";
import {
  allowedSaleModes,
  groupAllowsCustom,
  resolveSizeAxis,
  SALE_MODES,
  type SaleMode,
} from "../../utils/saleModes";
import { ProductImagesField } from "./ProductImagesField";
import { ProductMaterialField } from "./ProductMaterialField";
import { ProductQuickAttributeGroupDialog } from "./ProductQuickAttributeGroupDialog";
import { ProductSetItemsField } from "./ProductSetItemsField";
import { ProductSizeChartDialog } from "./ProductSizeChartDialog";
import { ProductSkuField } from "./ProductSkuField";

type Lang = AdminContentLang;
const LANG_FIELDS = {
  vi: { name: "name", description: "description" },
  en: { name: "nameEn", description: "descriptionEn" },
} as const;

/**
 * Thẻ section chuẩn theo cấu trúc module Admin:
 * viền thanh mảnh, typography chuẩn mực và hỗ trợ aside cho công cụ ngữ cảnh.
 */
function Section({
  title,
  description,
  aside,
  children,
  customHeader
}: {
  title: ReactNode;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  customHeader?: string;
}) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "overflow-hidden p-5 sm:p-6")}>
      <header className={cn(customHeader, "mb-4 flex flex-wrap items-center justify-between gap-2 pb-3")}>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#09090B]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-[#71717A]">{description}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

/**
 * Trình chỉnh sửa chi tiết sản phẩm may đo Thiên Canh:
 * - Thông tin chung tích hợp toàn diện: Tên, Phân cấp danh mục (Cha → Con), Giá bán, Bảng size, Mô tả, Hình ảnh, Màu sắc & Biến thể SKU tồn kho.
 * - Nút "Tùy chọn" popover: Switch Sản phẩm nổi bật, Mở dialog Chất liệu & Thiết kế, Liên kết trực tiếp Danh mục Kho.
 * - Loại bỏ hoàn toàn khối Chất liệu & Thiết kế ở ngoài để giao diện gọn gàng, không lặp lại.
 */
export function ProductEditor({
  initialProduct,
  options,
}: {
  initialProduct: AdminProductDetail;
  options: AdminProductEditorOptions;
}) {
  const t = useTranslations("AdminPage.products");
  const tSizing = useTranslations("AdminPage.sizing");
  const locale = useLocale();
  const notify = useNotify();

  const [product, setProduct] = useState(initialProduct);
  const [values, setValues] = useState<ProductFormState>(() => toFormState(initialProduct));
  const [baseline, setBaseline] = useState(values);
  const [lang, setLang] = useState<Lang>(locale === "en" ? "en" : "vi");
  const [isSaving, setIsSaving] = useState(false);
  const [sizeCharts, setSizeCharts] = useState(options.sizeCharts);
  const [attributes, setAttributes] = useState(options.attributes);
  const [designGroups, setDesignGroups] = useState(options.designGroups);
  const [quickGroupOpen, setQuickGroupOpen] = useState(false);
  const [selectedDesignGroupCode, setSelectedDesignGroupCode] = useState<string | null>(null);
  const [isCustomChart, setIsCustomChart] = useState(() => Boolean(values.sizeChartId));
  const [unassignedMode, setUnassignedMode] = useState<"preset" | "custom">("preset");
  const [createChartOpen, setCreateChartOpen] = useState(false);

  const fields = LANG_FIELDS[lang];
  const isDirty = JSON.stringify(values) !== JSON.stringify(baseline);

  // Phân cấp Loại sản phẩm (Cấp cha: root có parentId === null; Cấp con: có parentId)
  const rootCategories = options.categories.filter((c) => c.parentId === null);
  const currentCategory = options.categories.find((c) => c.id === values.categoryId) ?? options.categories[0];
  const currentRootCategory =
    currentCategory.parentId === null
      ? currentCategory
      : (rootCategories.find((r) => r.id === currentCategory.parentId) ??
         rootCategories.find((r) => r.group === currentCategory.group) ??
         rootCategories[0]);
  const childCategories = options.categories.filter((c) => c.parentId === currentRootCategory.id);

  const group = currentCategory.group;
  const traits = PRODUCT_GROUP_TRAITS[group];
  const allowedModes = allowedSaleModes(group);
  const hasCategoryChart = Boolean(currentCategory.defaultSizeChartId);
  const categoryChart = hasCategoryChart
    ? (sizeCharts.find((c) => c.id === currentCategory.defaultSizeChartId) ?? null)
    : null;

  // Bảng size hiệu lực: riêng của sản phẩm, không có thì theo loại (đã tính thừa hưởng nhóm gốc)
  const chartId = values.sizeChartId || currentCategory.defaultSizeChartId;
  const chart = sizeCharts.find((c) => c.id === chartId) ?? null;
  const sameGroupCharts = sizeCharts.filter((c) => c.group === group);
  const axis = resolveSizeAxis({
    group,
    saleMode: values.saleMode,
    chartSizes: chart?.sizeLabels ?? null,
    attributeSizes: attributes.filter((a) => a.group === "SIZE" && a.isActive).map((a) => a.code),
  });
  const colors = attributes.filter((a) => a.group === "COLOR");
  const issues = getActivationIssues({ ...values, setItemCount: values.setItems.length });
  const productNotices: AdminNotice[] = issues
    .filter((issue) => issue !== "SET_ITEMS" || values.saleMode === "SET")
    .map((issue) => ({
      tone: "info",
      text: t(`ready.${issue}`),
    }));
  const customAllowed = groupAllowsCustom(group);
  const takesMeasurements = values.saleMode === "CUSTOM" || values.isCustomFit;

  // Xác định tab có cần điền thông tin bổ sung / điều kiện mở bán hay không
  const saleModeNeedsData =
    (values.saleMode === "SET" && values.setItems.length < 2) ||
    (takesMeasurements && (values.leadTimeDays === null || values.leadTimeDays <= 0)) ||
    (values.saleMode !== "CUSTOM" && traits.sizing !== "NONE" && !values.sizeChartId && !currentCategory.defaultSizeChartId);

  const traitsNeedsData =
    values.variants.length === 0 ||
    hasDuplicateVariant(values.variants) ||
    values.images.length < MIN_IMAGES_TO_ACTIVATE ||
    !values.materialId;

  // Tính tổng tồn kho hiện tại của các biến thể SKU
  const totalStock = values.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  const stockUnit = values.saleMode === "CUSTOM" ? null : traits.sellUnit === "METER" ? "meter" : "piece";

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  /** Đổi nhóm hàng cha: tự động chọn loại con đầu tiên của nhóm đó */
  const handleRootChange = (nextRootId: string) => {
    const nextRoot = rootCategories.find((r) => r.id === nextRootId);
    if (!nextRoot) return;
    const children = options.categories.filter((c) => c.parentId === nextRoot.id);
    const nextChild = children[0] ?? nextRoot;
    changeCategory(nextChild.id);
  };

  /** Đổi loại sản phẩm: loại bỏ những gì không còn hợp với nhóm hàng mới */
  const changeCategory = (categoryId: string) => {
    const next = options.categories.find((c) => c.id === categoryId);
    if (!next) return;
    setValues((prev) => {
      const keepChart = options.sizeCharts.find((c) => c.id === prev.sizeChartId)?.group === next.group;
      const mode: SaleMode = allowedSaleModes(next.group).includes(prev.saleMode) ? prev.saleMode : "SINGLE";
      return {
        ...prev,
        categoryId,
        saleMode: mode,
        sizeChartId: keepChart ? prev.sizeChartId : "",
        isCustomFit: mode === "CUSTOM" || (prev.isCustomFit && groupAllowsCustom(next.group)),
      };
    });
  };

  const changeMode = (mode: SaleMode) =>
    setValues((prev) => ({
      ...prev,
      saleMode: mode,
      isCustomFit: mode === "CUSTOM" ? true : prev.saleMode === "CUSTOM" ? false : prev.isCustomFit,
      setItems:
        mode === "SET" && prev.setItems.length === 0
          ? [
              { label: "Áo dài", labelEn: "Áo dài top", quantity: 1, materialId: null },
              { label: "Quần", labelEn: "Pants", quantity: 1, materialId: null },
            ]
          : prev.setItems,
    }));

  const toggleAttribute = (id: string) =>
    set(
      "attributeIds",
      values.attributeIds.includes(id) ? values.attributeIds.filter((a) => a !== id) : [...values.attributeIds, id]
    );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setLang("vi");
      notify.error("PRODUCT_NAME_REQUIRED", "PRODUCT_UPDATE_FAILED");
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateProductAction({ ...toPayload(values), productId: product.id });
      if (!res.success) {
        notify.error(res.error, "PRODUCT_UPDATE_FAILED");
        return;
      }
      notify.success(t("updateSuccess"));
      const next = toFormState(res.data);
      setProduct(res.data);
      setValues(next);
      setBaseline(next);
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = values[fields.name] || values.name || product.name;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <AdminDetailHeader
        isDirty={isDirty}
        backHref="/admin/products"
        backLabel={t("editor.back")}
        title={displayName}
        badge={
          <AdminStatusText tone={baseline.isActive ? "success" : "neutral"}>
            {baseline.isActive ? t("active") : t("hidden")}
          </AdminStatusText>
        }
        actions={
          <button type="submit" disabled={!isDirty || isSaving} className={ADMIN_PRIMARY_BUTTON_CLASS}>
            {isSaving ? t("saving") : t("editor.save")}
          </button>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Cột chính: Các phần nhập liệu sản phẩm */}
        <div className="min-w-0 space-y-5">
          {/* 1. Thông tin chung (Tên, Loại cha → con, Giá, Bảng size, Mô tả, Ảnh, Màu sắc & SKU) */}
          <Section
            title={t("sections.general")}
            aside={
              <AdminLangSwitch
                value={lang}
                onChange={setLang}
                label={t("editor.langLabel")}
                // hint={t("editor.langHint")}
                status={{ en: values.nameEn ? undefined : "missing" }}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminTextField
                key={`name-${lang}`}
                required={lang === "vi"}
                label={t("field.name")}
                value={values[fields.name]}
                onValueChange={(value) => set(fields.name, value)}
                placeholder={t(`placeholders.${lang}.name`)}
              />

              <AdminTextField
                label={t("field.code")}
                value={product.code}
                readOnly
                disabled
                hint={t("hints.code")}
                inputClassName="font-mono font-medium tabular-nums bg-[#F4F4F5] text-[#52525B] cursor-not-allowed selection:bg-transparent"
              />

              {/* Tách chọn loại thành: Chọn Nhóm hàng (Cha) → Chọn Loại sản phẩm (Con) */}
              <AdminField
                label={t("field.categoryParent")}
                hint={t("hints.categoryParent")}
              >
                <AdminFilterSelect
                  value={currentRootCategory.id}
                  options={rootCategories.map((r) => ({ value: r.id, label: r.name }))}
                  onChange={handleRootChange}
                  className="h-10 w-full"
                />
              </AdminField>

              <AdminField
                label={t("field.category")}
                hint={t("hints.categoryChild")}
              >
                <AdminFilterSelect
                  value={currentCategory.id}
                  options={(childCategories.length > 0 ? childCategories : [currentRootCategory]).map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  onChange={changeCategory}
                  className="h-10 w-full"
                />
              </AdminField>

              <AdminTextArea
                key={`description-${lang}`}
                className="sm:col-span-2"
                label={t("field.description")}
                value={values[fields.description]}
                onValueChange={(value) => set(fields.description, value)}
                rows={3}
                placeholder={t(`placeholders.${lang}.description`)}
              />
            </div>
          </Section>

          {/* 2. Cấu hình chi tiết: Hình thức bán & Đặc tính (2 tab gắn kết với khối nội dung) */}
          <AdminTabs defaultValue="saleMode" className="w-full gap-3">
            <AdminTabsList>
              <AdminTabsTrigger value="saleMode">
                <ShoppingBag size={16} aria-hidden />
                <span>{t("sections.saleMode")}</span>
                {saleModeNeedsData && (
                  <span
                    className="size-2 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-500/20"
                    aria-hidden
                  />
                )}
              </AdminTabsTrigger>
              <AdminTabsTrigger value="traits">
                <SlidersHorizontal size={16} aria-hidden />
                <span>{t("sections.traits")}</span>
                {traitsNeedsData && (
                  <span
                    className="size-2 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-500/20"
                    aria-hidden
                  />
                )}
              </AdminTabsTrigger>
            </AdminTabsList>

            {/* Tab 1: Hình thức bán & May đo */}
            <AdminTabsContent value="saleMode">
              <div className={cn(ADMIN_CARD_CLASS, "p-5 sm:p-6")}>
                {/* 1. Chọn hình thức bán (dễ nhận diện, mô tả flex theo loại đang chọn) */}
                <div>
                  <div className="grid w-full grid-cols-3 gap-3">
                    {SALE_MODES.map((mode) => {
                      const enabled = allowedModes.includes(mode);
                      const selected = values.saleMode === mode;
                      return (
                        <AdminTooltip
                          key={mode}
                          content={enabled ? null : t("mode.notAllowedFor", { group: tSizing(`group.${group}`) })}
                        >
                          <button
                            type="button"
                            disabled={!enabled}
                            aria-pressed={selected}
                            onClick={() => changeMode(mode)}
                            className={cn(
                              "flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40",
                              selected
                                ? "bg-[#18181B] text-white shadow-xs"
                                : "border border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#A1A1AA] hover:text-[#09090B]"
                            )}
                          >
                            {selected && <Check size={15} className="stroke-[2.5]" aria-hidden />}
                            <span>{t(`mode.${mode}.label`)}</span>
                          </button>
                        </AdminTooltip>
                      );
                    })}
                  </div>
                  {/* Mô tả flex theo loại đang chọn */}
                  <p className="mt-3 text-xs leading-relaxed text-[#71717A]">
                    {values.saleMode === "SINGLE"
                      ? t("hints.saleModeSingle")
                      : values.saleMode === "SET"
                        ? t("hints.saleModeSet")
                        : t("hints.saleModeCustom")}
                  </p>
                </div>

                {values.saleMode === "SET" && (
                  <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
                    <h3 className="mb-3 text-body font-semibold text-[#09090B]">{t("set.title")}</h3>
                    <ProductSetItemsField
                      items={values.setItems}
                      onChange={(items) => set("setItems", items)}
                      materials={options.materials}
                      lang={lang}
                      inputClassName={ADMIN_INPUT_CLASS}
                      mainMaterialId={values.materialId}
                    />
                    {values.setItems.length < 2 && <p className="mt-2 text-xs text-amber-700">{t("set.min")}</p>}
                  </div>
                )}

                {/* Bảng size áp dụng: Chỉ hiện khi bán theo size (Một món hoặc Theo bộ) */}
                {values.saleMode !== "CUSTOM" && traits.sizing !== "NONE" && (
                  <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
                    <div className="mb-3 flex items-center">
                      <h3 className="text-body font-semibold text-[#09090B]">{t("field.sizeChart")}</h3>
                      <AdminInfoTip content={t("hints.sizeChart")} />
                    </div>

                    {hasCategoryChart ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 select-none">
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-[#09090B]">
                              {t("field.sizeChartCustomSwitch")}
                            </span>
                            <span className="mt-0.5 block text-xs text-[#71717A]">
                              {t("field.sizeChartCustomHint")}
                            </span>
                          </div>
                          <AdminSwitch
                            checked={isCustomChart}
                            onChange={(checked) => {
                              setIsCustomChart(checked);
                              if (!checked) {
                                set("sizeChartId", "");
                              }
                            }}
                            label={t("field.sizeChartCustomSwitch")}
                          />
                        </div>

                        {!isCustomChart ? (
                          <div className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-3 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-[#18181B]">
                                  {categoryChart?.name ?? t("sizeChartNone")}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-[#E4E4E7] px-2 py-0.5 text-2xs font-medium text-[#52525B]">
                                  {t("field.sizeChartFromCategory", { name: currentCategory.name })}
                                </span>
                              </div>
                              {categoryChart && (
                                <Link
                                  href={`/admin/catalog/size-charts/${categoryChart.id}`}
                                  target="_blank"
                                  className="text-2xs text-[#71717A] hover:text-[#18181B] hover:underline"
                                >
                                  {t("field.sizeChartDetailLink")} ↗
                                </Link>
                              )}
                            </div>
                            {categoryChart && categoryChart.sizeLabels.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                <span className="text-[#71717A]">{t("sku.sizes")}:</span>
                                {categoryChart.sizeLabels.map((s) => (
                                  <span
                                    key={s}
                                    className="rounded border border-[#E4E4E7] bg-white px-1.5 py-0.5 font-mono text-2xs font-medium text-[#18181B] shadow-2xs"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 pt-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <AdminFilterSelect
                                  value={values.sizeChartId || ""}
                                  options={[
                                    { value: "", label: t("field.sizeChartSelectPlaceholder") },
                                    ...sameGroupCharts.map((c) => ({ value: c.id, label: c.name })),
                                  ]}
                                  onChange={(value) => set("sizeChartId", value)}
                                  className="h-10 w-full"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setCreateChartOpen(true)}
                                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 text-xs font-medium text-[#18181B] transition-colors hover:bg-[#F4F4F5]"
                              >
                                <Plus size={14} aria-hidden />
                                <span>{t("field.sizeChartCreateNew")}</span>
                              </button>
                            </div>

                            {chart && (
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#52525B]">
                                <span className="text-[#71717A]">{t("sku.sizes")}:</span>
                                {chart.sizeLabels.map((s) => (
                                  <span
                                    key={s}
                                    className="rounded border border-[#E4E4E7] bg-[#F4F4F5] px-1.5 py-0.5 font-mono text-2xs font-medium text-[#18181B]"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-amber-950">
                                {t("field.sizeChartUnassignedWarning", { name: currentCategory.name })}
                              </p>
                              <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                                {t("field.sizeChartUnassignedHint")}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setUnassignedMode("preset")}
                            className={cn(
                              "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors cursor-pointer",
                              unassignedMode === "preset"
                                ? "border-[#18181B] bg-white shadow-2xs ring-1 ring-[#18181B]"
                                : "border-[#E4E4E7] bg-[#FAFAFA] hover:bg-white hover:border-[#D4D4D8]"
                            )}
                          >
                            <div className="flex items-center gap-1.5 font-medium text-xs text-[#09090B]">
                              <span className="flex size-4 items-center justify-center rounded-full bg-[#18181B] text-[10px] text-white font-bold">
                                1
                              </span>
                              <span>{t("field.sizeChartOptionPreset")}</span>
                            </div>
                            <p className="text-2xs text-[#71717A] leading-normal">
                              {t("field.sizeChartOptionPresetHint")}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setUnassignedMode("custom");
                              setCreateChartOpen(true);
                            }}
                            className={cn(
                              "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors cursor-pointer",
                              unassignedMode === "custom"
                                ? "border-[#18181B] bg-white shadow-2xs ring-1 ring-[#18181B]"
                                : "border-[#E4E4E7] bg-[#FAFAFA] hover:bg-white hover:border-[#D4D4D8]"
                            )}
                          >
                            <div className="flex items-center gap-1.5 font-medium text-xs text-[#09090B]">
                              <span className="flex size-4 items-center justify-center rounded-full bg-[#18181B] text-[10px] text-white font-bold">
                                2
                              </span>
                              <span>{t("field.sizeChartOptionCustom")}</span>
                            </div>
                            <p className="text-2xs text-[#71717A] leading-normal">
                              {t("field.sizeChartOptionCustomHint")}
                            </p>
                          </button>
                        </div>

                        {unassignedMode === "preset" ? (
                          <div className="space-y-2 pt-1">
                            <AdminFilterSelect
                              value={values.sizeChartId || ""}
                              options={[
                                { value: "", label: t("field.sizeChartSelectPlaceholder") },
                                ...sameGroupCharts.map((c) => ({ value: c.id, label: c.name })),
                              ]}
                              onChange={(value) => set("sizeChartId", value)}
                              className="h-10 w-full"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setCreateChartOpen(true)}
                              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#18181B] bg-[#18181B] px-3 text-xs font-medium text-white transition-colors hover:bg-black"
                            >
                              <Plus size={14} aria-hidden />
                              <span>
                                {values.sizeChartId ? t("field.sizeChartEditCustom") : t("field.sizeChartEnterCustom")}
                              </span>
                            </button>
                            {values.sizeChartId && chart && (
                              <span className="text-xs font-medium text-[#18181B]">
                                {chart.name}
                              </span>
                            )}
                          </div>
                        )}

                        {chart && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#52525B]">
                            <span className="text-[#71717A]">{t("sku.sizes")}:</span>
                            {chart.sizeLabels.map((s) => (
                              <span
                                key={s}
                                className="rounded border border-[#E4E4E7] bg-[#F4F4F5] px-1.5 py-0.5 font-mono text-2xs font-medium text-[#18181B]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {values.saleMode !== "CUSTOM" && customAllowed && (
                  <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
                    <div className="flex items-center justify-between gap-3 select-none">
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-[#09090B]">{t("field.isCustomFit")}</span>
                        <span className="mt-0.5 block text-xs text-[#71717A]">{t("hints.isCustomFit")}</span>
                      </div>
                      <AdminSwitch
                        checked={values.isCustomFit}
                        onChange={(checked) => set("isCustomFit", checked)}
                        label={t("field.isCustomFit")}
                      />
                    </div>
                  </div>
                )}

                {takesMeasurements && traits.customMeasurement && (
                  <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
                    <div className="space-y-5">
                      {/* 1. Số đo khách cần gửi (có tooltip i và danh sách pills có icon Ruler, gọn gàng) */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-[#09090B]">
                            {t("custom.measurements")}
                          </span>
                          <AdminInfoTip content={t("hints.customMeasurements")} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {traits.suggestedKeys.map((key) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 rounded-md bg-[#F4F4F5] px-2 py-0.5 text-2xs font-medium text-[#3F3F46]"
                            >
                              <Ruler size={11} className="text-[#71717A]" aria-hidden />
                              <span>{tSizing(`measurement.${key}`)}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 2. Thời gian may (ô nhập vừa vặn, không rộng full, có tooltip i giải thích lý do) */}
                      <div className="w-36">
                        <AdminTextField
                          type="number"
                          label={t("field.leadTimeDays")}
                          hint={t("hints.leadTimeReason")}
                          min={1}
                          max={180}
                          value={values.leadTimeDays === null ? "" : String(values.leadTimeDays)}
                          onValueChange={(value) =>
                            set("leadTimeDays", value === "" ? null : Math.max(1, Math.min(180, Math.round(Number(value)))))
                          }
                          placeholder={t("placeholders.leadTimeDays")}
                          suffix={<span className="text-xs text-[#71717A]">{t("custom.days")}</span>}
                          inputClassName="font-mono tabular-nums bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AdminTabsContent>

            {/* Tab 2: Đặc tính (Chất liệu, Thiết kế, Màu sắc & Biến thể SKU, Hình ảnh) */}
            <AdminTabsContent value="traits">
              <div className={cn(ADMIN_CARD_CLASS, "p-5 sm:p-6")}>
                <div className="space-y-6">
                  {/* 2.1 Chất liệu vải & Đặc tính thiết kế may đo */}
                  <div className="space-y-5">
                    {/* Chọn chất liệu vải chính */}
                    <div>
                      <h3 className="mb-2 text-body font-semibold text-[#09090B]">
                        {t("materialDialog.materialSection")}
                      </h3>
                      <ProductMaterialField
                        value={values.materialId}
                        onChange={(materialId) => set("materialId", materialId)}
                        materials={options.materials}
                      />
                    </div>

                    {/* Đặc tính thiết kế may đo (cổ, tay, tà, lót, họa tiết...) */}
                    <div className="border-t border-dashed border-[#E4E4E7] pt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-body font-semibold text-[#09090B]">
                          {t("materialDialog.designSection")}
                        </h3>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-[#71717A]">{t("quickAttribute.missingOptionPrompt")}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDesignGroupCode(null);
                              setQuickGroupOpen(true);
                            }}
                            className="font-medium text-[#09090B] hover:text-[#18181B] hover:underline hover:underline-offset-2 cursor-pointer"
                          >
                            {t("quickAttribute.addNewAction")}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {designGroups.map((designGroup) => {
                            const choices = attributes.filter(
                              (a) => a.group === designGroup.code && (a.isActive || values.attributeIds.includes(a.id))
                            );
                            return (
                              <div
                                key={designGroup.code}
                                className="grid gap-1.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4 items-center"
                              >
                                <div className="flex items-center gap-1.5 pt-1">
                                  <span className="text-sm font-medium text-[#3F3F46]">
                                    {locale === "en" && designGroup.nameEn ? designGroup.nameEn : designGroup.name}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {choices.map((choice) => {
                                    const on = values.attributeIds.includes(choice.id);
                                    return (
                                      <button
                                        key={choice.id}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => toggleAttribute(choice.id)}
                                        className={cn(
                                          "h-8 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors",
                                          on
                                            ? "border-[#18181B] bg-[#18181B] text-white"
                                            : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#A1A1AA]"
                                        )}
                                      >
                                        {choice.name}
                                      </button>
                                    );
                                  })}
                                  {choices.length === 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDesignGroupCode(designGroup.code);
                                        setQuickGroupOpen(true);
                                      }}
                                      className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-dashed border-[#D4D4D8] px-3 text-xs font-medium text-[#71717A] hover:border-[#18181B] hover:text-[#09090B] transition-colors"
                                    >
                                      <Plus size={12} aria-hidden />
                                      <span>
                                        {t("design.addTraitForGroup", {
                                          name: (locale === "en" && designGroup.nameEn ? designGroup.nameEn : designGroup.name).toLowerCase(),
                                        })}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <p className="pt-4 text-end text-2xs text-[#71717A]">
                          {t("materialDialog.selectedTraits", { count: values.attributeIds.length })}
                        </p>
                      </div>
                  </div>

                  {/* 2.2 Màu sắc, Size & Biến thể SKU tồn kho */}
                  <div className="border-t border-dashed border-[#E4E4E7] pt-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-body font-semibold text-[#09090B]">{t("sections.pricing")}</h3>
                        <AdminInfoTip
                          popupClassName="max-w-[340px]"
                          content={
                            <div className="space-y-2 text-xs">
                              <p className="font-semibold text-white">{t("hints.pricingTitle")}</p>
                              <p className="text-[#D4D4D8] leading-relaxed">{t("hints.pricingDesc")}</p>
                              <div className="border-t border-[#3F3F46] pt-1.5 space-y-1 text-2xs text-[#A1A1AA]">
                                <p className="font-semibold text-white/90">{t("hints.pricingNotesTitle")}:</p>
                                <p className="flex items-start gap-1">
                                  <span className="text-amber-400">•</span>
                                  <span>{t("hints.pricingNote1")}</span>
                                </p>
                                <p className="flex items-start gap-1">
                                  <span className="text-amber-400">•</span>
                                  <span>{t("hints.pricingNote2")}</span>
                                </p>
                                <p className="flex items-start gap-1">
                                  <span className="text-amber-400">•</span>
                                  <span>{t("hints.pricingNote3")}</span>
                                </p>
                              </div>
                            </div>
                          }
                        />
                      </div>
                    </div>

                    <ProductSkuField
                      key={`${axis.kind}-${axis.kind === "sized" ? axis.sizes.join(",") : ""}`}
                      rows={values.variants}
                      onChange={(rows) => set("variants", rows)}
                      productCode={product.code}
                      axis={axis}
                      colors={colors}
                      basePrice={values.basePrice}
                      onBasePriceChange={(price) => set("basePrice", price)}
                      stockUnit={stockUnit}
                      totalStock={totalStock}
                    />
                  </div>

                  {/* 2.3 Hình ảnh sản phẩm */}
                  <div className="border-t border-dashed border-[#E4E4E7] pt-5">
                    <div className="mb-3">
                      <h3 className="text-body font-semibold text-[#09090B]">{t("field.images")}</h3>
                      <p className="mt-0.5 text-xs text-[#71717A]">{t("image.hint", { max: 8 })}</p>
                    </div>
                    <ProductImagesField value={values.images} onChange={(images) => set("images", images)} />
                  </div>
                </div>
              </div>
            </AdminTabsContent>
          </AdminTabs>
        </div>

        {/* Cột phụ: Trạng thái sản phẩm & Vận hành */}
        <aside className="space-y-5 xl:sticky xl:top-[8rem]">
          <Section 
            title={t("colStatus")} 
            aside={
              <AdminNoticeHint
                notices={productNotices}
                title={t("hints.readyConditions")}
                emptyText={t("hints.readyAllMet")}
                ariaLabel={t("hints.readyConditions")}
              />
            }
            // customHeader="border-b border-dashed border-[#E4E4E7]" 
          >
            <div className="space-y-4">
              {/* 1. Trạng thái Mở bán */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[#09090B]">{t("field.isActive")}</span>
                    <p className="mt-0.5 text-xs text-[#71717A]">
                      {values.isActive ? t("hints.activeStatus") : t("hints.hiddenStatus")}
                    </p>
                  </div>
                  <AdminSwitch
                    checked={values.isActive}
                    onChange={(checked) => set("isActive", checked)}
                    disabled={!values.isActive && issues.length > 0}
                    label={t("field.isActive")}
                  />
                </div>
              </div>

              {/* 2. Sản phẩm nổi bật */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#09090B]">{t("field.isFeatured")}</span>
                  <p className="mt-0.5 text-xs text-[#71717A]">{t("hints.featuredHint")}</p>
                </div>
                <AdminSwitch
                  checked={values.isFeatured}
                  onChange={(checked) => set("isFeatured", checked)}
                  label={t("field.isFeatured")}
                />
              </div>

              {/* 3. Liên kết kho hàng */}
              <div className="border-t border-dashed border-[#E4E4E7] pt-4">
                <span className="mb-2 block text-xs font-medium text-[#71717A]">
                  {t("options.warehouseTitle")}
                </span>
                <div className="space-y-1">
                  <a
                    href={`/admin/inventory/skus?search=${product.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-[#3F3F46] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
                  >
                    <span className="flex items-center gap-2">
                      <Boxes size={14} className="text-[#71717A]" />
                      {t("options.skuStock")}
                    </span>
                    <ExternalLink size={12} className="text-[#A1A1AA]" />
                  </a>
                  {values.materialId && (
                    <a
                      href={`/admin/inventory/fabrics?search=${product.code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-[#3F3F46] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
                    >
                      <span className="flex items-center gap-2">
                        <Scissors size={14} className="text-[#71717A]" />
                        {t("options.fabricStock")}
                      </span>
                      <ExternalLink size={12} className="text-[#A1A1AA]" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Section>
        </aside>
      </div>

      {createChartOpen && (
        <ProductSizeChartDialog
          group={group}
          defaultName={`${values.name || t("field.name")} - ${t("sizeChartDefaultSuffix")}`}
          onClose={() => setCreateChartOpen(false)}
          onCreated={(newChart) => {
            setSizeCharts((prev) => [newChart, ...prev]);
            set("sizeChartId", newChart.id);
            setIsCustomChart(true);
          }}
        />
      )}

      {quickGroupOpen && (
        <ProductQuickAttributeGroupDialog
          groups={designGroups}
          initialGroupCode={selectedDesignGroupCode}
          onClose={() => {
            setQuickGroupOpen(false);
            setSelectedDesignGroupCode(null);
          }}
          onGroupCreated={(newGroup) => {
            setDesignGroups((prev) => [...prev, newGroup]);
          }}
          onAttributesCreated={(newAttributes) => {
            setAttributes((prev) => [...prev, ...newAttributes]);
            setValues((prev) => ({
              ...prev,
              attributeIds: [
                ...prev.attributeIds,
                ...newAttributes.map((a) => a.id).filter((id) => !prev.attributeIds.includes(id)),
              ],
            }));
          }}
        />
      )}
    </form>
  );
}
