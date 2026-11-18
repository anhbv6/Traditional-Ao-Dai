"use client";

import { useState, type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { Boxes, Check, CircleDashed, ExternalLink, Info, Scissors, Shirt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PRODUCT_GROUP_TRAITS } from "@repo/shared/sizing";
import { formatVnd, type Locale } from "@repo/shared";
import { useAnchorPositionMethod } from "@/hooks/useAnchorPositionMethod";
import { useNotify } from "@/hooks/useNotify";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  AdminAdvancedOptions,
  AdminDetailHeader,
  AdminField,
  AdminFilterSelect,
  AdminLangSwitch,
  AdminStatusText,
  AdminSwitch,
  AdminTextArea,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { updateProductAction } from "../../actions/products.actions";
import { type AdminProductDetail, type AdminProductEditorOptions } from "../../types/products.types";
import { toFormState, toPayload, type ProductFormState } from "../../utils/productEditorForm";
import { getActivationIssues, type ActivationIssue } from "../../utils/products.utils";
import {
  allowedSaleModes,
  groupAllowsCustom,
  resolveSizeAxis,
  SALE_MODES,
  type SaleMode,
} from "../../utils/saleModes";
import { ProductImagesField } from "./ProductImagesField";
import { ProductMaterialField } from "./ProductMaterialField";
import { ProductSetItemsField } from "./ProductSetItemsField";
import { ProductSkuField } from "./ProductSkuField";

type Lang = AdminContentLang;
const LANG_FIELDS = {
  vi: { name: "name", description: "description" },
  en: { name: "nameEn", description: "descriptionEn" },
} as const;
const INHERIT_CHART = "__inherit__";
const ISSUES: ActivationIssue[] = ["IMAGES", "PRICE", "SKUS", "DUPLICATE_SKU", "SET_ITEMS"];

/**
 * Popover danh sách điều kiện cần để mở bán (kích hoạt bằng hover hoặc click vào icon ⓘ ở góc Trạng thái).
 */
function ReadyConditionsPopover({
  issues,
  saleMode,
}: {
  issues: ActivationIssue[];
  saleMode: string;
}) {
  const { positionMethod, captureAnchor } = useAnchorPositionMethod();
  const t = useTranslations("AdminPage.products");

  return (
    <Popover.Root onOpenChange={(open, details) => open && captureAnchor(details.event)}>
      <Popover.Trigger
        openOnHover
        delay={80}
        closeDelay={120}
        aria-label={t("hints.readyConditions")}
        className="inline-grid size-5 cursor-pointer place-items-center rounded-full text-[#A1A1AA] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/20 data-popup-open:text-[#09090B]"
      >
        <Info size={14} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          positionMethod={positionMethod}
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 outline-none"
        >
          <Popover.Popup className="admin-shell w-[290px] origin-[var(--transform-origin)] rounded-xl border border-[#E4E4E7] bg-white p-3.5 shadow-[0_16px_40px_-16px_rgba(9,9,11,0.25)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#09090B]">
                {t("hints.readyConditions")}
              </span>
              <span className={cn("text-2xs font-medium", issues.length === 0 ? "text-emerald-700" : "text-amber-700")}>
                {issues.length === 0 ? t("hints.readyAllMet") : t("preview.readyPending", { count: issues.length })}
              </span>
            </div>
            <ul className="space-y-2 text-xs">
              {ISSUES.filter((issue) => issue !== "SET_ITEMS" || saleMode === "SET").map((issue) => {
                const ok = !issues.includes(issue);
                return (
                  <li
                    key={issue}
                    className={cn("flex items-center gap-2", ok ? "text-[#52525B]" : "font-medium text-[#09090B]")}
                  >
                    {ok ? (
                      <Check size={13} className="shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                      <CircleDashed size={13} className="shrink-0 text-amber-600" aria-hidden />
                    )}
                    <span>{t(`ready.${issue}`)}</span>
                  </li>
                );
              })}
            </ul>
            {issues.length > 0 && (
              <p className="mt-3 border-t border-dashed border-[#E4E4E7] pt-2 text-2xs text-[#71717A]">
                {t("hints.notReady")}
              </p>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * Thẻ section chuẩn theo cấu trúc module Admin (đồng bộ cùng detail Bộ sưu tập):
 * container query, viền thanh mảnh, typography Thiên Canh mộc mạc và hỗ trợ aside cho công cụ ngữ cảnh.
 */
function Section({
  title,
  description,
  aside,
  children,
}: {
  title: ReactNode;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "overflow-hidden p-5 sm:p-6")}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2 pb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[#09090B]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-[#71717A]">{description}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

/** Dòng bật / tắt tùy chọn chuẩn mực dùng công tắc AdminSwitch */
function ToggleRow({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 select-none",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[#09090B]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-[#71717A]">{hint}</span>}
      </div>
      <AdminSwitch
        checked={checked}
        onChange={onChange}
        label={label}
        disabled={disabled}
      />
    </div>
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

  // Bảng size hiệu lực: riêng của sản phẩm, không có thì theo loại (đã tính thừa hưởng nhóm gốc)
  const chartId = values.sizeChartId || currentCategory.defaultSizeChartId;
  const chart = options.sizeCharts.find((c) => c.id === chartId) ?? null;
  const sameGroupCharts = options.sizeCharts.filter((c) => c.group === group);
  const axis = resolveSizeAxis({
    group,
    saleMode: values.saleMode,
    chartSizes: chart?.sizeLabels ?? null,
    attributeSizes: options.attributes.filter((a) => a.group === "SIZE" && a.isActive).map((a) => a.code),
  });
  const colors = options.attributes.filter((a) => a.group === "COLOR");
  const currentMaterial = options.materials.find((m) => m.id === values.materialId) ?? null;
  const issues = getActivationIssues({ ...values, setItemCount: values.setItems.length });
  const customAllowed = groupAllowsCustom(group);
  const takesMeasurements = values.saleMode === "CUSTOM" || values.isCustomFit;

  // Tính các màu sắc thực tế và đặc tính thiết kế đã chọn để xem trước
  const activeColorIds = new Set([
    ...values.variants.flatMap((row) => (row.colorId ? [row.colorId] : [])),
    ...values.attributeIds,
  ]);
  const selectedColors = colors.filter((c) => activeColorIds.has(c.id));
  const selectedDesignTraits = options.attributes.filter(
    (a) => a.group !== "COLOR" && a.group !== "SIZE" && values.attributeIds.includes(a.id)
  );

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
              <div className="flex w-full items-center justify-between gap-2 @lg:w-auto @lg:justify-end">
                {/* Nút "Tùy chọn" popover đồng bộ như Bộ sưu tập */}
                <AdminAdvancedOptions
                  label={t("editor.options")}
                  activeCount={values.isFeatured ? 1 : 0}
                  widthClass="w-[320px]"
                >
                  <ToggleRow
                    checked={values.isFeatured}
                    onChange={(checked) => set("isFeatured", checked)}
                    label={t("field.isFeatured")}
                    hint={t("hints.featuredHint")}
                  />

                  {/* Liên kết nghiệp vụ với Danh mục Kho */}
                  <div className="border-t border-dashed border-[#E4E4E7] pt-3">
                    <span className="mb-1.5 block text-2xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                      {t("options.warehouseTitle")}
                    </span>
                    <div className="space-y-1">
                      <a
                        href={`/admin/inventory/skus?search=${product.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#09090B]"
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
                          className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#09090B]"
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
                </AdminAdvancedOptions>

                <AdminLangSwitch
                  value={lang}
                  onChange={setLang}
                  label={t("editor.langLabel")}
                  hint={t("editor.langHint")}
                  status={{ en: values.nameEn ? undefined : "missing" }}
                />
              </div>
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
                  label={t("field.categoryParentShort")}
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
                  label={t("field.categoryShort")}
                  value={currentCategory.id}
                  options={(childCategories.length > 0 ? childCategories : [currentRootCategory]).map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  onChange={changeCategory}
                  className="h-10 w-full"
                />
              </AdminField>

              {/* Giá bán chung */}
              <AdminTextField
                required
                className="sm:col-span-2"
                label={t("field.basePrice")}
                mask="currency"
                currencyOptions={{ thousandSeparator: locale === "vi" ? "." : "," }}
                value={values.basePrice ? String(values.basePrice) : ""}
                onValueChange={(_display, raw) => set("basePrice", Math.max(0, Math.round(Number(raw) || 0)))}
                placeholder={t("placeholders.basePrice")}
                suffix={<span className="text-xs text-[#71717A]">₫</span>}
                inputClassName="font-mono tabular-nums"
              />

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

          {/* 2. Hình thức bán & May đo */}
          <Section title={t("sections.saleMode")} description={t("hints.saleMode")}>
            <div className="grid gap-3 sm:grid-cols-3">
              {SALE_MODES.map((mode) => {
                const enabled = allowedModes.includes(mode);
                const selected = values.saleMode === mode;
                return (
                  <AdminTooltip
                    key={mode}
                    content={enabled ? null : t("mode.notAllowedFor", { group: tSizing(`group.${group}`) })}
                  >
                    <span className="grid" tabIndex={enabled ? undefined : 0}>
                      <button
                        type="button"
                        disabled={!enabled}
                        aria-pressed={selected}
                        onClick={() => changeMode(mode)}
                        className={cn(
                          "relative flex w-full cursor-pointer flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40",
                          selected
                            ? "border-[#18181B] bg-[#FAFAFA] ring-1 ring-[#18181B] shadow-xs"
                            : "border-[#E4E4E7] bg-white hover:border-[#D4D4D8] hover:bg-[#FAFAFA]/50"
                        )}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm font-semibold tracking-tight",
                              selected ? "text-[#09090B]" : "text-[#27272A]"
                            )}
                          >
                            {t(`mode.${mode}.label`)}
                          </span>
                          <span
                            aria-hidden
                            className={cn(
                              "grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
                              selected ? "border-[#18181B] bg-[#18181B]" : "border-[#D4D4D8] bg-white"
                            )}
                          >
                            {selected && <span className="size-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <span className={cn("text-xs leading-normal", selected ? "text-[#52525B]" : "text-[#71717A]")}>
                          {t(`mode.${mode}.short`)}
                        </span>
                      </button>
                    </span>
                  </AdminTooltip>
                );
              })}
            </div>

            {values.saleMode === "SET" && (
              <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
                <h3 className="mb-3 text-sm font-semibold text-[#18181B]">{t("set.title")}</h3>
                <ProductSetItemsField
                  items={values.setItems}
                  onChange={(items) => set("setItems", items)}
                  materials={options.materials}
                  lang={lang}
                  inputClassName={ADMIN_INPUT_CLASS}
                />
                {values.setItems.length < 2 && <p className="mt-2 text-xs text-amber-700">{t("set.min")}</p>}
              </div>
            )}

            {/* Bảng size áp dụng: Chỉ hiện khi bán theo size (Một món hoặc Theo bộ) */}
            {values.saleMode !== "CUSTOM" && traits.sizing !== "NONE" && (
              <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
                <AdminField label={t("field.sizeChart")} hint={t("hints.sizeChart")}>
                  <AdminFilterSelect
                    label={t("field.sizeChartShort")}
                    value={values.sizeChartId || INHERIT_CHART}
                    options={[
                      {
                        value: INHERIT_CHART,
                        label: currentCategory.defaultSizeChartId
                          ? t("sizeChartInherit", {
                              name: options.sizeCharts.find((c) => c.id === currentCategory.defaultSizeChartId)?.name ?? "—",
                            })
                          : t("sizeChartNone"),
                      },
                      ...sameGroupCharts.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    onChange={(value) => set("sizeChartId", value === INHERIT_CHART ? "" : value)}
                    className="h-10 w-full"
                  />
                </AdminField>
                {chart && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-[#52525B]">
                    <span className="text-[#71717A]">{t("inherit.sizes")}:</span>
                    {chart.sizeLabels.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-[#E4E4E7] bg-[#FAFAFA] px-2 py-0.5 font-mono text-2xs font-medium text-[#18181B]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {values.saleMode !== "CUSTOM" && customAllowed && (
              <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
                <ToggleRow
                  checked={values.isCustomFit}
                  onChange={(checked) => set("isCustomFit", checked)}
                  label={t("field.isCustomFit")}
                  hint={t("hints.isCustomFit")}
                />
              </div>
            )}

            {takesMeasurements && traits.customMeasurement && (
              <div className="mt-5 grid gap-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA]/70 p-3.5 sm:grid-cols-[minmax(0,1fr)_160px]">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-[#27272A]">
                    {t("custom.measurements")}{" "}
                    <span className="text-xs font-normal text-[#71717A]">({t("custom.inherited")})</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {traits.suggestedKeys.map((key) => (
                      <span
                        key={key}
                        className="rounded-md border border-[#E4E4E7] bg-white px-2 py-0.5 text-xs text-[#52525B]"
                      >
                        {tSizing(`measurement.${key}`)}
                      </span>
                    ))}
                  </div>
                </div>
                <AdminTextField
                  type="number"
                  label={t("field.leadTimeDays")}
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
            )}
          </Section>

          {/* 3. Khối Đặc tính (Chất liệu & thiết kế, Màu sắc size SKU, Hình ảnh) */}
          <Section title={t("sections.traits")} description={t("hints.traits")}>
            <div className="space-y-6">
              {/* 3.1 Chất liệu vải & Đặc tính thiết kế may đo */}
              <div className="space-y-5">
                {/* Chọn chất liệu vải chính */}
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
                    {t("materialDialog.materialSection")}
                  </h3>
                  <ProductMaterialField
                    value={values.materialId}
                    onChange={(materialId) => set("materialId", materialId)}
                    materials={options.materials}
                  />
                </div>

                {/* Đặc tính thiết kế may đo (cổ, tay, tà, lót, họa tiết...) */}
                {options.designGroups.length > 0 && (
                  <div className="border-t border-dashed border-[#E4E4E7] pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">
                        {t("materialDialog.designSection")}
                      </h3>
                      <span className="text-2xs text-[#71717A]">
                        {t("materialDialog.selectedTraits", { count: values.attributeIds.length })}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {options.designGroups.map((designGroup) => {
                        const choices = options.attributes.filter(
                          (a) => a.group === designGroup.code && (a.isActive || values.attributeIds.includes(a.id))
                        );
                        if (choices.length === 0) return null;
                        return (
                          <div key={designGroup.code} className="grid gap-1.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
                            <span className="pt-1 text-sm font-medium text-[#3F3F46]">
                              {locale === "en" && designGroup.nameEn ? designGroup.nameEn : designGroup.name}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {choices.map((choice) => {
                                const on = values.attributeIds.includes(choice.id);
                                return (
                                  <button
                                    key={choice.id}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => toggleAttribute(choice.id)}
                                    className={cn(
                                      "h-7 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors",
                                      on
                                        ? "border-[#18181B] bg-[#18181B] text-white"
                                        : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#A1A1AA]"
                                    )}
                                  >
                                    {choice.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="pt-2 text-2xs text-[#71717A]">
                      {t("design.manage")}{" "}
                      <Link
                        href="/admin/catalog/attributes"
                        target="_blank"
                        className="font-medium text-[#09090B] hover:underline"
                      >
                        {t("design.manageLink")}
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              {/* 3.2 Màu sắc, Size & Biến thể SKU tồn kho */}
              <div className="border-t border-dashed border-[#E4E4E7] pt-5">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-[#09090B]">{t("sections.pricing")}</h3>
                  <p className="text-xs text-[#71717A]">{t("hints.pricing")}</p>
                </div>

                {/* Thanh thông tin & liên kết Danh mục Kho */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#52525B]">
                  <div className="flex items-center gap-2">
                    <Boxes size={15} className="text-[#71717A]" aria-hidden />
                    <span>
                      {stockUnit === null
                        ? t("options.unitCustom")
                        : `${t("colStock")}: ${totalStock} ${stockUnit === "meter" ? t("options.unitMeter") : t("options.unitPiece")}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/admin/inventory/skus?search=${product.code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[#09090B] hover:underline"
                    >
                      {t("options.skuStock")} <ExternalLink size={11} aria-hidden />
                    </a>
                    {values.materialId && (
                      <a
                        href={`/admin/inventory/fabrics?search=${product.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#09090B] hover:underline"
                      >
                        {t("options.fabricStock")} <ExternalLink size={11} aria-hidden />
                      </a>
                    )}
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
                  stockUnit={values.saleMode === "CUSTOM" ? null : traits.sellUnit === "METER" ? "meter" : "piece"}
                />
              </div>

              {/* 3.3 Hình ảnh sản phẩm */}
              <div className="border-t border-dashed border-[#E4E4E7] pt-5">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-[#09090B]">{t("field.images")}</h3>
                  <p className="text-xs text-[#71717A]">{t("image.hint", { max: 8 })}</p>
                </div>
                <ProductImagesField value={values.images} onChange={(images) => set("images", images)} />
              </div>
            </div>
          </Section>
        </div>

        {/* Cột phụ: Trạng thái phát hành & Thông số kế thừa */}
        <aside className="space-y-5 xl:sticky xl:top-[8rem]">
          {/* Card xem nhanh sản phẩm & Điều kiện mở bán */}
          <Section
            title={
              <span className="inline-flex items-center gap-1.5">
                <span>{t("colStatus")}</span>
                <ReadyConditionsPopover issues={issues} saleMode={values.saleMode} />
              </span>
            }
            aside={
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    values.isActive ? "text-emerald-700" : "text-[#71717A]"
                  )}
                >
                  {values.isActive ? t("active") : t("hidden")}
                </span>
                <AdminSwitch
                  checked={values.isActive}
                  onChange={(checked) => set("isActive", checked)}
                  disabled={!values.isActive && issues.length > 0}
                  label={t("field.isActive")}
                />
              </div>
            }
          >
            <div className="flex gap-3 pb-3.5">
              <span className="grid aspect-[3/4] w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-[#F4F4F5] ring-1 ring-[#E4E4E7]/80">
                {values.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ảnh do admin tải lên (URL tùy ý)
                  <img src={values.images[0]} alt="" className="size-full object-cover" />
                ) : (
                  <Shirt size={18} className="text-[#A1A1AA]" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-2xs text-[#71717A]">{product.code}</p>
                <p className="line-clamp-2 text-sm font-semibold text-[#09090B]">
                  {displayName}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-[#09090B]">
                  {values.basePrice > 0 ? formatVnd(values.basePrice, locale as Locale) : "—"}
                </p>
              </div>
            </div>

            {/* Khối xem trước các thông số đã thêm (thay thế vùng khoanh đỏ) */}
            <div className="border-t border-dashed border-[#E4E4E7] pt-3.5">
              <p className="mb-2.5 text-2xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                {t("preview.title")}
              </p>
              <dl className="space-y-2.5 text-xs">
                {/* Phân loại danh mục */}
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#71717A]">{t("field.categoryShort")}</dt>
                  <dd className="font-medium text-[#09090B] text-right">
                    {currentRootCategory.name} › {currentCategory.name}
                  </dd>
                </div>

                {/* Hình thức bán */}
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#71717A]">{t("field.saleMode")}</dt>
                  <dd className="font-medium text-[#09090B]">
                    {t(`mode.${values.saleMode}.label`)}
                  </dd>
                </div>

                {/* Màu sắc đã chọn */}
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-[#71717A]">{t("sku.colors")}</dt>
                  <dd className="flex max-w-[65%] flex-wrap items-center justify-end gap-1 text-right font-medium text-[#09090B]">
                    {selectedColors.length > 0 ? (
                      selectedColors.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 rounded bg-[#FAFAFA] px-1.5 py-0.5 text-2xs ring-1 ring-[#E4E4E7]"
                        >
                          <span
                            className="size-2 shrink-0 rounded-full border border-black/15 shadow-xs"
                            style={{ backgroundColor: c.hex ?? "#D4D4D8" }}
                            aria-hidden
                          />
                          <span>{c.name}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[#A1A1AA]">{t("sku.noColor")}</span>
                    )}
                  </dd>
                </div>

                {/* Bảng size & Dải size */}
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-[#71717A]">{t("field.sizeChartShort")}</dt>
                  <dd className="min-w-0 text-right font-medium text-[#09090B]">
                    <span>{chart ? chart.name : t("sizeChartNone")}</span>
                    {axis.kind === "sized" && axis.sizes.length > 0 && (
                      <span className="block font-mono text-2xs font-normal text-[#71717A]">
                        {axis.sizes.join(" · ")}
                      </span>
                    )}
                  </dd>
                </div>

                {/* Biến thể SKU & Tồn kho */}
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#71717A]">{t("preview.variants")}</dt>
                  <dd className="font-mono font-medium tabular-nums text-[#09090B]">
                    {values.variants.length} SKU · {totalStock}{" "}
                    {stockUnit === "meter" ? t("options.unitMeter") : t("options.unitPiece")}
                  </dd>
                </div>

                {/* Chất liệu vải chính */}
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#71717A]">{t("material.label")}</dt>
                  <dd className="truncate font-medium text-[#09090B]">
                    {currentMaterial ? currentMaterial.name : t("options.materialNone")}
                  </dd>
                </div>

                {/* Đặc tính thiết kế (nếu có chọn) */}
                {selectedDesignTraits.length > 0 && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-[#71717A]">{t("preview.designTraits")}</dt>
                    <dd className="max-w-[65%] text-right font-medium text-[#09090B]">
                      {selectedDesignTraits.map((a) => a.name).join(" · ")}
                    </dd>
                  </div>
                )}

                {/* May đo riêng */}
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#71717A]">{t("custom.measurements")}</dt>
                  <dd className="font-medium text-[#09090B]">
                    {takesMeasurements
                      ? values.leadTimeDays
                        ? `${t("inherit.custom")} (${values.leadTimeDays} ${t("custom.days")})`
                        : t("inherit.custom")
                      : t("inherit.noCustom")}
                  </dd>
                </div>

                {/* Sản phẩm nổi bật */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-[#F4F4F5]">
                  <dt className="text-[#71717A]">{t("field.isFeatured")}</dt>
                  <dd className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-2xs font-medium",
                        values.isFeatured ? "text-amber-700" : "text-[#71717A]"
                      )}
                    >
                      {values.isFeatured ? t("preview.featuredYes") : t("preview.featuredNo")}
                    </span>
                    <AdminSwitch
                      checked={values.isFeatured}
                      onChange={(checked) => set("isFeatured", checked)}
                      label={t("field.isFeatured")}
                    />
                  </dd>
                </div>
              </dl>
            </div>
          </Section>

          {/* Card Thông số kế thừa từ danh mục & Đơn vị kho */}
          <Section title={t("inherit.title")} description={t("inherit.hint")}>
            <dl className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#71717A]">{t("field.categoryParentShort")}</dt>
                <dd className="font-medium text-[#09090B]">{currentRootCategory.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#71717A]">{t("field.categoryShort")}</dt>
                <dd className="font-medium text-[#09090B]">{currentCategory.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#71717A]">{t("inherit.sellUnit")}</dt>
                <dd className="font-medium text-[#09090B]">{tSizing(`sellUnit.${traits.sellUnit}`)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#71717A]">{t("inherit.custom")}</dt>
                <dd className="text-right font-medium text-[#09090B]">
                  {traits.customMeasurement ? t(`inherit.measure.${traits.customMeasurement}`) : t("inherit.noCustom")}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[#71717A]">{t("inherit.sizes")}</dt>
                <dd className="min-w-0 text-right font-medium text-[#09090B]">
                  {axis.kind === "custom" ? (
                    t("sku.customSize")
                  ) : axis.kind === "free" ? (
                    t("sku.freeSize")
                  ) : axis.source === "chart" && chart ? (
                    <Link href={`/admin/catalog/size-charts/${chart.id}`} className="text-[#09090B] hover:underline">
                      {chart.name}
                    </Link>
                  ) : (
                    t("inherit.sizesFromAttributes")
                  )}
                  {axis.kind === "sized" && (
                    <span className="block font-mono text-2xs font-normal text-[#71717A]">
                      {axis.sizes.join(" · ")}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#71717A]">{t("inherit.modes")}</dt>
                <dd className="text-right font-medium text-[#09090B]">
                  {allowedModes.map((mode) => t(`mode.${mode}.label`)).join(" · ")}
                </dd>
              </div>
            </dl>
          </Section>
        </aside>
      </div>
    </form>
  );
}
