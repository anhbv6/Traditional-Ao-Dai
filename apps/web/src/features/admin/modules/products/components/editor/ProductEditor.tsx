"use client";

import { useState, type ReactNode } from "react";
import { Check, CircleDashed, Scissors, Shirt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PRODUCT_GROUP_TRAITS } from "@repo/shared/sizing";
import { formatVnd, type Locale } from "@repo/shared";
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
  AdminTextArea,
  AdminTextField,
  type AdminContentLang,
  AdminTooltip,
} from "@/features/admin/core/ui";
import { PRODUCT_GROUP_COLORS, PRODUCT_GROUP_ICONS } from "@/features/admin/modules/categories";
import { updateProductAction } from "../../actions/products.actions";
import { type AdminProductDetail, type AdminProductEditorOptions } from "../../types/products.types";
import { toFormState, toPayload, type ProductFormState } from "../../utils/productEditorForm";
import { getActivationIssues, type ActivationIssue } from "../../utils/products.utils";
import {
  SALE_MODES,
  SALE_MODE_ICONS,
  allowedSaleModes,
  groupAllowsCustom,
  resolveSizeAxis,
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

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
      <h2 className="mb-4 flex items-center gap-1.5 text-lg font-semibold text-[#09090B]">
        {title}
        {hint && <AdminInfoTip content={hint} />}
      </h2>
      {children}
    </section>
  );
}

function Switch({
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
    <label
      className={cn(
        "flex items-start justify-between gap-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#09090B]">{label}</span>
        {hint && <span className="mt-0.5 block text-2xs leading-4 text-[#A1A1AA]">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#18181B]/25",
          checked ? "bg-[#18181B]" : "bg-[#E4E4E7]"
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-white shadow-xs transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    </label>
  );
}

/**
 * Màn chi tiết sản phẩm. Mọi thứ "biết được từ danh mục" đều kế thừa thay vì nhập lại:
 * nhóm hàng của loại → hình thức bán hợp lệ, có nhận may đo không, có size không, bán theo cái hay theo mét;
 * bảng size của loại → ký hiệu size để sinh SKU; chất liệu → thanh đo, bảo quản, định mức;
 * thuộc tính → màu (có ô màu) và đặc tính thiết kế.
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
  const category = options.categories.find((c) => c.id === values.categoryId) ?? options.categories[0];
  const group = category.group;
  const traits = PRODUCT_GROUP_TRAITS[group];
  const allowedModes = allowedSaleModes(group);
  const GroupIcon = PRODUCT_GROUP_ICONS[group];
  const groupColor = PRODUCT_GROUP_COLORS[group];

  // Bảng size hiệu lực: riêng của sản phẩm, không có thì theo loại (đã tính thừa hưởng nhóm gốc)
  const chartId = values.sizeChartId || category.defaultSizeChartId;
  const chart = options.sizeCharts.find((c) => c.id === chartId) ?? null;
  const sameGroupCharts = options.sizeCharts.filter((c) => c.group === group);
  const axis = resolveSizeAxis({
    group,
    saleMode: values.saleMode,
    chartSizes: chart?.sizeLabels ?? null,
    attributeSizes: options.attributes.filter((a) => a.group === "SIZE" && a.isActive).map((a) => a.code),
  });
  const colors = options.attributes.filter((a) => a.group === "COLOR");
  const issues = getActivationIssues({ ...values, setItemCount: values.setItems.length });
  const customAllowed = groupAllowsCustom(group);
  const takesMeasurements = values.saleMode === "CUSTOM" || values.isCustomFit;

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  /** Đổi loại sản phẩm: bỏ những gì không còn hợp với nhóm hàng mới */
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <AdminDetailHeader
        backHref="/admin/products"
        backLabel={t("editor.back")}
        title={values.name || product.name}
        badge={
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
              baseline.isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#F4F4F5] text-[#52525B]"
            )}
          >
            <span className={cn("size-1.5 rounded-full", baseline.isActive ? "bg-emerald-500" : "bg-[#A1A1AA]")} />
            {baseline.isActive ? t("active") : t("hidden")}
          </span>
        }
        subtitle={
          <>
            <span className="font-mono">{product.code}</span> · {t(`mode.${values.saleMode}.label`)}
            {isDirty && <span className="ml-2 text-amber-700">● {t("editor.unsaved")}</span>}
          </>
        }
        actions={
          <>
            {/* Một công tắc ngôn ngữ cho mọi trường song ngữ trên màn (tên, mô tả, tên món trong bộ) */}
            <AdminLangSwitch
              value={lang}
              onChange={setLang}
              label={t("editor.langLabel")}
              hint={t("editor.langHint")}
              status={{ en: values.nameEn ? undefined : "missing" }}
            />
            <button type="submit" disabled={!isDirty || isSaving} className={ADMIN_PRIMARY_BUTTON_CLASS}>
              {isSaving ? t("saving") : t("editor.save")}
            </button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {/* 1. Thông tin chung */}
          <Card title={t("sections.general")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminTextField
                key={`name-${lang}`}
                required={lang === "vi"}
                className="sm:col-span-2"
                label={t("field.name")}
                value={values[fields.name]}
                onValueChange={(value) => set(fields.name, value)}
                placeholder={t(`placeholders.${lang}.name`)}
              />
              <AdminField label={t("field.category")} hint={t("hints.category")} className="sm:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminFilterSelect
                    label={t("field.categoryShort")}
                    value={values.categoryId}
                    options={options.categories.map((c) => ({ value: c.id, label: c.label }))}
                    onChange={changeCategory}
                    className="h-10 min-w-0 flex-1"
                  />
                  <span
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium",
                      groupColor.chip
                    )}
                  >
                    <GroupIcon size={13} aria-hidden /> {tSizing(`group.${group}`)}
                  </span>
                </div>
              </AdminField>
              <AdminTextArea
                key={`description-${lang}`}
                className="sm:col-span-2"
                label={t("field.description")}
                value={values[fields.description]}
                onValueChange={(value) => set(fields.description, value)}
                rows={4}
                placeholder={t(`placeholders.${lang}.description`)}
              />
            </div>
            <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-body font-semibold text-[#09090B]">
                {t("field.images")}
                <AdminInfoTip content={t("image.hint", { max: 8 })} />
              </h3>
              <ProductImagesField value={values.images} onChange={(images) => set("images", images)} />
            </div>
          </Card>

          {/* 2. Hình thức bán */}
          <Card title={t("sections.saleMode")} hint={t("hints.saleMode")}>
            <div className="grid gap-2 sm:grid-cols-3">
              {SALE_MODES.map((mode) => {
                const Icon = SALE_MODE_ICONS[mode];
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
                          "flex w-full cursor-pointer flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                          selected
                            ? "border-[#18181B] bg-[#18181B] text-white"
                            : "border-[#E4E4E7] text-[#3F3F46] hover:border-[#A1A1AA]"
                        )}
                      >
                        <Icon size={16} aria-hidden />
                        <span className="text-sm font-semibold">{t(`mode.${mode}.label`)}</span>
                        <span className={cn("text-2xs leading-4", selected ? "text-white/70" : "text-[#71717A]")}>
                          {t(`mode.${mode}.short`)}
                        </span>
                      </button>
                    </span>
                  </AdminTooltip>
                );
              })}
            </div>

            {values.saleMode === "SET" && (
              <div className="mt-4 border-t border-dashed border-[#E4E4E7] pt-4">
                <h3 className="mb-2 text-body font-semibold text-[#09090B]">{t("set.title")}</h3>
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

            {values.saleMode !== "CUSTOM" && customAllowed && (
              <div className="mt-4 border-t border-dashed border-[#E4E4E7] pt-4">
                <Switch
                  checked={values.isCustomFit}
                  onChange={(checked) => set("isCustomFit", checked)}
                  label={t("field.isCustomFit")}
                  hint={t("hints.isCustomFit")}
                />
              </div>
            )}

            {takesMeasurements && traits.customMeasurement && (
              <div className="mt-4 grid gap-4 border-t border-dashed border-[#E4E4E7] pt-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
                    <Scissors size={13} className="text-[#71717A]" aria-hidden />
                    {t("custom.measurements")}
                    <span className="text-xs font-normal text-[#A1A1AA]">{t("custom.inherited")}</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {traits.suggestedKeys.map((key) => (
                      <span
                        key={key}
                        className="rounded border border-[#E4E4E7] bg-white px-1.5 py-0.5 text-2xs text-[#52525B]"
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
                  suffix={<span className="text-xs text-[#A1A1AA]">{t("custom.days")}</span>}
                  inputClassName="font-mono tabular-nums"
                />
              </div>
            )}
          </Card>

          {/* 3. Chất liệu & thiết kế */}
          <Card title={t("sections.design")} hint={t("hints.design")}>
            <ProductMaterialField
              value={values.materialId}
              onChange={(materialId) => set("materialId", materialId)}
              materials={options.materials}
            />
            <div className="mt-5 space-y-3 border-t border-dashed border-[#E4E4E7] pt-4">
              {/* Nhóm đặc tính lấy từ màn Thuộc tính — nhóm admin thêm mới cũng hiện ở đây */}
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
                              "h-7 cursor-pointer rounded-full border px-2.5 text-xs font-medium transition-colors",
                              on
                                ? "border-[#18181B] bg-[#18181B] text-white"
                                : "border-[#E4E4E7] text-[#3F3F46] hover:border-[#A1A1AA]"
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
              <p className="text-2xs text-[#A1A1AA]">
                {t("design.manage")}{" "}
                <Link href="/admin/catalog/attributes" className="font-medium text-[#52525B] hover:underline">
                  {t("design.manageLink")}
                </Link>
              </p>
            </div>
          </Card>

          {/* 4. Giá & SKU */}
          <Card title={t("sections.pricing")} hint={t("hints.pricing")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminTextField
                required
                label={t("field.basePrice")}
                /* Mask tiền: hiện 1.250.000, `raw` chỉ còn chữ số để lưu số nguyên VND */
                mask="currency"
                currencyOptions={{ thousandSeparator: locale === "vi" ? "." : "," }}
                value={values.basePrice ? String(values.basePrice) : ""}
                onValueChange={(_display, raw) => set("basePrice", Math.max(0, Math.round(Number(raw) || 0)))}
                placeholder={t("placeholders.basePrice")}
                suffix={<span className="text-xs text-[#A1A1AA]">₫</span>}
                inputClassName="font-mono tabular-nums"
              />
              {axis.kind !== "custom" && traits.sizing !== "NONE" && (
                <AdminField label={t("field.sizeChart")} hint={t("hints.sizeChart")}>
                  <AdminFilterSelect
                    label={t("field.sizeChartShort")}
                    value={values.sizeChartId || INHERIT_CHART}
                    options={[
                      {
                        value: INHERIT_CHART,
                        label: category.defaultSizeChartId
                          ? t("sizeChartInherit", {
                              name: options.sizeCharts.find((c) => c.id === category.defaultSizeChartId)?.name ?? "—",
                            })
                          : t("sizeChartNone"),
                      },
                      ...sameGroupCharts.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    onChange={(value) => set("sizeChartId", value === INHERIT_CHART ? "" : value)}
                    className="h-10 w-full"
                  />
                </AdminField>
              )}
            </div>
            <div className="mt-5 border-t border-dashed border-[#E4E4E7] pt-4">
              <ProductSkuField
                // Trục size đổi thì dựng lại bộ chọn màu / size cho khớp
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
          </Card>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-[8rem]">
          <section className={cn(ADMIN_CARD_CLASS, "overflow-hidden")}>
            <div className="flex gap-3 p-4">
              <span className="grid aspect-[3/4] w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-[#F4F4F5]">
                {values.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ảnh do admin tải lên (URL tùy ý)
                  <img src={values.images[0]} alt="" className="size-full object-contain" />
                ) : (
                  <Shirt size={18} className="text-[#A1A1AA]" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-2xs text-[#71717A]">{product.code}</p>
                <p className="line-clamp-2 text-sm font-semibold text-[#09090B]">
                  {values[fields.name] || values.name}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-[#09090B]">
                  {values.basePrice > 0 ? formatVnd(values.basePrice, locale as Locale) : "—"}
                </p>
              </div>
            </div>
            <div className="space-y-3 border-t border-dashed border-[#E4E4E7] px-4 py-3">
              <Switch
                checked={values.isActive}
                onChange={(checked) => set("isActive", checked)}
                label={t("field.isActive")}
                hint={issues.length > 0 && !values.isActive ? t("hints.notReady") : undefined}
                disabled={!values.isActive && issues.length > 0}
              />
              <Switch
                checked={values.isFeatured}
                onChange={(checked) => set("isFeatured", checked)}
                label={t("field.isFeatured")}
              />
            </div>
            <ul className="space-y-1.5 border-t border-dashed border-[#E4E4E7] px-4 py-3">
              {ISSUES.filter((issue) => issue !== "SET_ITEMS" || values.saleMode === "SET").map((issue) => {
                const ok = !issues.includes(issue);
                return (
                  <li
                    key={issue}
                    className={cn("flex items-center gap-2 text-xs", ok ? "text-[#71717A]" : "text-[#09090B]")}
                  >
                    {ok ? (
                      <Check size={13} className="text-emerald-600" aria-hidden />
                    ) : (
                      <CircleDashed size={13} className="text-amber-600" aria-hidden />
                    )}
                    {t(`ready.${issue}`)}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={cn(ADMIN_CARD_CLASS, "p-4")}>
            <h2 className="mb-3 flex items-center gap-1.5 text-lg font-semibold text-[#09090B]">
              {t("inherit.title")}
              <AdminInfoTip content={t("inherit.hint")} />
            </h2>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#71717A]">{t("inherit.group")}</dt>
                <dd
                  className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium", groupColor.chip)}
                >
                  <GroupIcon size={12} aria-hidden /> {tSizing(`group.${group}`)}
                </dd>
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
                    <Link href={`/admin/catalog/size-charts/${chart.id}`} className="hover:underline">
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
          </section>
        </aside>
      </div>
    </form>
  );
}
