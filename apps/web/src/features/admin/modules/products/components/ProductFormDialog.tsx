"use client";

import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { PRODUCT_GROUP_TRAITS } from "@repo/shared/sizing";
import { TextField, type TextFieldProps } from "@/components/shared/TextField";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useNotify } from "@/hooks/useNotify";
import { AdminFilterSelect } from "@/features/admin/core/ui";
import { createProductAction, updateProductAction } from "../actions/products.actions";
import { productDetailKey, useProductDetail } from "../hooks/useProductDetail";
import { productFormSchema, type ProductFormValues } from "../schemas/products.schemas";
import {
  type AdminProductCategory,
  type AdminProductDetail,
  type AdminProductItem,
  type AdminProductSizeChart,
} from "../types/products.types";
import { ProductImagesField } from "./ProductImagesField";
import { ProductCheckbox } from "./ProductRowParts";
import { ProductVariantsField } from "./ProductVariantsField";

interface ProductFormDialogProps {
  open: boolean;
  /** null = thêm mới */
  productId: string | null;
  categories: AdminProductCategory[];
  sizeCharts: AdminProductSizeChart[];
  onOpenChange: (open: boolean) => void;
  onSaved: (product: AdminProductItem) => void;
}

const FIELD_PROPS = {
  appearance: "outline",
  tone: "admin",
  size: "sm",
  fieldClassName: "rounded-lg",
  labelClassName: "text-xs font-medium normal-case tracking-normal",
} satisfies Partial<TextFieldProps>;

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]";

function toFormValues(product: AdminProductDetail | null): ProductFormValues {
  return {
    name: product?.name ?? "",
    nameEn: product?.nameEn ?? "",
    categoryId: product?.categoryId ?? "",
    sizeChartId: product?.sizeChartId ?? "",
    material: product?.material ?? "",
    materialEn: product?.materialEn ?? "",
    description: product?.description ?? "",
    descriptionEn: product?.descriptionEn ?? "",
    // Ô giá trống khi thêm mới; undefined để không hiện sẵn số 0
    basePrice: product ? Number(product.basePrice) : (undefined as unknown as number),
    images: product?.images ?? [],
    // Sản phẩm mới mặc định ẩn: chỉ mở bán khi đã đủ ảnh, giá và SKU
    isActive: product?.isActive ?? false,
    isCustomFit: product?.isCustomFit ?? true,
    isFeatured: product?.isFeatured ?? false,
    collectionCode: "",
    variants:
      product?.variants.map((v) => ({
        id: v.id,
        // SKU đã có giữ nguyên mã, chỉ sinh lại khi admin bật "Tự sinh"
        skuAuto: false,
        sku: v.sku,
        size: v.size,
        color: v.color ?? "",
        useBasePrice: v.price === null,
        price: v.price,
        stock: v.stock,
      })) ?? [],
  };
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-[#09090B]">{title}</h3>
      {children}
    </section>
  );
}

function FlagField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3F3F46]">
      <ProductCheckbox checked={checked} onChange={onChange} label={label} />
      {label}
    </label>
  );
}

/** Dialog thêm mới / sửa sản phẩm: chờ tải xong chi tiết rồi mới dựng form để giá trị ban đầu luôn đúng */
export function ProductFormDialog({
  open,
  productId,
  categories,
  sizeCharts,
  onOpenChange,
  onSaved,
}: ProductFormDialogProps) {
  const t = useTranslations("AdminPage.products");
  const detail = useProductDetail(open ? productId : null);
  const isReady = !productId || Boolean(detail.data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-shell flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-xl border border-[#E4E4E7] bg-white p-0 sm:max-w-3xl">
        <div className="border-b border-[#E4E4E7] px-4 py-4 pr-12 sm:px-6">
          <DialogTitle className="text-base font-semibold text-[#09090B]">
            {productId ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-[#71717A]">
            {productId ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </div>

        {isReady ? (
          <ProductForm
            key={productId ?? "new"}
            product={detail.data ?? null}
            categories={categories}
            sizeCharts={sizeCharts}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        ) : detail.isError ? (
          <p className="px-6 py-16 text-center text-sm text-rose-700">{t("loadFailed")}</p>
        ) : (
          <div className="grid place-items-center py-20 text-[#71717A]">
            <Loader2 size={20} className="animate-spin" aria-label={t("loading")} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  product,
  categories,
  sizeCharts,
  onCancel,
  onSaved,
}: {
  product: AdminProductDetail | null;
  categories: AdminProductCategory[];
  sizeCharts: AdminProductSizeChart[];
  onCancel: () => void;
  onSaved: (product: AdminProductItem) => void;
}) {
  const t = useTranslations("AdminPage.products");
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(product),
  });
  const { errors, submitCount } = form.formState;

  const fieldError = (key?: string) => (key ? notify.translateError(key) : undefined);

  // Bảng size hiệu lực: gắn riêng, nếu không thì theo loại sản phẩm — dùng gợi ý ký hiệu size khi nhập SKU
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const sizeChartId = useWatch({ control: form.control, name: "sizeChartId" });
  const category = categories.find((c) => c.id === categoryId);
  const usesSizeChart = category ? PRODUCT_GROUP_TRAITS[category.group].sizing !== "NONE" : false;
  const groupCharts = category ? sizeCharts.filter((chart) => chart.group === category.group) : [];
  const inheritedChart = sizeCharts.find((chart) => chart.id === category?.defaultSizeChartId);
  const effectiveChart = usesSizeChart
    ? (sizeChartId ? sizeCharts.find((chart) => chart.id === sizeChartId) : inheritedChart)
    : undefined;

  const onSubmit = async (values: ProductFormValues) => {
    setIsSaving(true);
    try {
      const res = product
        ? await updateProductAction({ ...values, productId: product.id })
        : await createProductAction(values);

      if (!res.success) {
        notify.error(res.error, product ? "PRODUCT_UPDATE_FAILED" : "PRODUCT_CREATE_FAILED");
        return;
      }
      if (!res.data) return;

      if (product) await queryClient.invalidateQueries({ queryKey: productDetailKey(product.id) });
      notify.success(product ? t("updateSuccess") : t("createSuccess"));
      onSaved(res.data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
        <FormSection title={t("sectionInfo")}>
          <TextField
            {...FIELD_PROPS}
            {...form.register("name")}
            label={t("field.name")}
            error={fieldError(errors.name?.message)}
            shakeKey={submitCount}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <AdminFilterSelect
                    label={t("colCategory")}
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      // Bảng size riêng thuộc nhóm hàng khác thì bỏ, quay về bảng của loại mới
                      const nextGroup = categories.find((c) => c.id === value)?.group;
                      const chart = sizeCharts.find((c) => c.id === form.getValues("sizeChartId"));
                      if (chart && chart.group !== nextGroup) form.setValue("sizeChartId", "");
                    }}
                    options={[
                      { value: "", label: t("field.chooseCategory") },
                      ...categories.map((c) => ({ value: c.id, label: c.label })),
                    ]}
                    className="w-full"
                  />
                )}
              />
              {errors.categoryId?.message && (
                <p className="mt-1 text-xs text-rose-700">{fieldError(errors.categoryId.message)}</p>
              )}
            </div>
            <TextField
              {...FIELD_PROPS}
              {...form.register("material")}
              aria-label={t("colMaterial")}
              placeholder={t("field.materialPlaceholder")}
            />
          </div>
          {usesSizeChart && (
            <div className="space-y-1">
              <Controller
                control={form.control}
                name="sizeChartId"
                render={({ field }) => (
                  <AdminFilterSelect
                    label={t("field.sizeChart")}
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      {
                        value: "",
                        label: inheritedChart
                          ? t("field.sizeChartInherit", { name: inheritedChart.name })
                          : t("field.sizeChartNone"),
                      },
                      ...groupCharts.map((chart) => ({
                        value: chart.id,
                        label: chart.isActive ? chart.name : `${chart.name} (${t("field.sizeChartInactive")})`,
                      })),
                    ]}
                    className="w-full"
                  />
                )}
              />
              <p className="text-xs text-[#71717A]">
                {effectiveChart
                  ? t("field.sizeChartHint", { sizes: effectiveChart.sizeLabels.join(", ") || "—" })
                  : t("field.sizeChartMissing")}
              </p>
            </div>
          )}
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[#3F3F46]">{t("field.description")}</span>
            <textarea {...form.register("description")} rows={3} className={TEXTAREA_CLASS} />
          </label>
        </FormSection>

        <FormSection title={t("sectionSales")}>
          <div className="sm:max-w-xs">
            <TextField
              {...FIELD_PROPS}
              {...form.register("basePrice", { valueAsNumber: true })}
              type="number"
              min={1}
              label={t("colPrice")}
              suffix="₫"
              error={fieldError(errors.basePrice?.message)}
              shakeKey={submitCount}
              required
            />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {(["isActive", "isCustomFit", "isFeatured"] as const).map((name) => (
              <Controller
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FlagField label={t(`field.${name}`)} checked={field.value} onChange={field.onChange} />
                )}
              />
            ))}
          </div>
        </FormSection>

        <FormSection title={t("sectionImages")}>
          <Controller
            control={form.control}
            name="images"
            render={({ field }) => <ProductImagesField value={field.value} onChange={field.onChange} />}
          />
        </FormSection>

        <FormSection title={t("sectionVariants")}>
          <ProductVariantsField form={form} sizeOptions={effectiveChart?.sizeLabels ?? []} />
        </FormSection>

        <FormSection title={t("sectionEnglish")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField {...FIELD_PROPS} {...form.register("nameEn")} label={t("field.nameEn")} />
            <TextField {...FIELD_PROPS} {...form.register("materialEn")} label={t("field.materialEn")} />
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[#3F3F46]">{t("field.descriptionEn")}</span>
            <textarea {...form.register("descriptionEn")} rows={3} className={TEXTAREA_CLASS} />
          </label>
        </FormSection>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#E4E4E7] px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 cursor-pointer rounded-lg px-3.5 text-sm font-medium text-[#52525B] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="h-9 cursor-pointer rounded-lg bg-[#18181B] px-4 text-sm font-medium text-white shadow-2xs transition-colors hover:bg-[#09090B] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
