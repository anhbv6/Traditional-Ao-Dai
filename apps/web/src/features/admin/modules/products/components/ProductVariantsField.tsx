"use client";

import { type ReactNode } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { type ProductFormValues } from "../schemas/products.schemas";
import { buildSku } from "../utils/products.utils";

const INPUT_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B] disabled:bg-[#F4F4F5] disabled:text-[#71717A] aria-invalid:border-rose-500";
const ROW_GRID_CLASS = "grid grid-cols-2 gap-2 sm:grid-cols-[0.8fr_1fr_2.1fr_1.8fr_0.8fr_36px]";

/** Ô giá để trống = chưa nhập */
const toOptionalNumber = (value: unknown) => (value === "" || value === null ? null : Number(value));

/** Nhãn hiện trên mobile, nơi không có hàng tiêu đề cột */
function VariantCell({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1 block text-xs font-medium text-[#71717A] sm:hidden">{label}</span>
      {children}
    </label>
  );
}

/** Nút nhỏ nằm trong ô nhập: bật = hệ thống quyết định giá trị và khóa ô, tắt = bắt buộc nhập tay */
function FieldToggle({ label, pressed, onToggle, children }: { label: string; pressed: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <button
        type="button"
        aria-pressed={pressed}
        onClick={onToggle}
        className={cn(
          "absolute right-1 top-1/2 h-6 -translate-y-1/2 cursor-pointer rounded-md px-1.5 text-[11px] font-medium transition-colors",
          pressed ? "bg-[#18181B] text-white" : "bg-[#F4F4F5] text-[#52525B] hover:text-[#09090B]"
        )}
      >
        {label}
      </button>
    </div>
  );
}

const SIZE_LIST_ID = "product-variant-sizes";

function VariantRow({
  form,
  index,
  sizeOptions,
  onRemove,
}: {
  form: UseFormReturn<ProductFormValues>;
  index: number;
  sizeOptions: string[];
  onRemove: () => void;
}) {
  const t = useTranslations("AdminPage.products.variant");
  const notify = useNotify();
  const locale = useLocale() as Locale;
  const { control, register, setValue, clearErrors } = form;

  const skuAuto = useWatch({ control, name: `variants.${index}.skuAuto` });
  const useBasePrice = useWatch({ control, name: `variants.${index}.useBasePrice` });
  const color = useWatch({ control, name: `variants.${index}.color` });
  const size = useWatch({ control, name: `variants.${index}.size` });
  const productName = useWatch({ control, name: "name" });
  const collectionCode = useWatch({ control, name: "collectionCode" });
  const basePrice = useWatch({ control, name: "basePrice" });

  // Size không có trong bảng size thì khách không được gợi ý size đó — chỉ cảnh báo, vẫn cho lưu (VD size đặc biệt)
  const sizeOutsideChart =
    sizeOptions.length > 0 && size.trim() !== "" && !sizeOptions.some((label) => label.toUpperCase() === size.trim().toUpperCase());
  const skuPreview = buildSku({ collectionCode: collectionCode.trim().toUpperCase(), productName, color, size });
  const rowErrors = form.formState.errors.variants?.[index];
  const message =
    rowErrors?.size?.message ?? rowErrors?.sku?.message ?? rowErrors?.price?.message ?? rowErrors?.stock?.message;

  const toggleSkuAuto = () => {
    // Tắt tự sinh: giữ mã đang xem để admin sửa tay từ đó thay vì gõ lại
    if (skuAuto) setValue(`variants.${index}.sku`, skuPreview);
    setValue(`variants.${index}.skuAuto`, !skuAuto);
    clearErrors(`variants.${index}.sku`);
  };

  const toggleBasePrice = () => {
    setValue(`variants.${index}.useBasePrice`, !useBasePrice);
    clearErrors(`variants.${index}.price`);
  };

  return (
    <div className="rounded-lg border border-[#E4E4E7] p-2 sm:border-0 sm:p-0">
      <div className={ROW_GRID_CLASS}>
        <VariantCell label={`${t("size")} *`}>
          <input
            {...register(`variants.${index}.size`)}
            list={sizeOptions.length > 0 ? SIZE_LIST_ID : undefined}
            aria-label={t("size")}
            aria-invalid={Boolean(rowErrors?.size)}
            placeholder={t("sizePlaceholder")}
            className={INPUT_CLASS}
          />
        </VariantCell>

        <VariantCell label={t("color")}>
          <input
            {...register(`variants.${index}.color`)}
            aria-label={t("color")}
            placeholder={t("colorPlaceholder")}
            className={INPUT_CLASS}
          />
        </VariantCell>

        <VariantCell label={`${t("sku")} *`} className="col-span-2 sm:col-span-1">
          <FieldToggle label={t("autoSku")} pressed={skuAuto} onToggle={toggleSkuAuto}>
            {skuAuto ? (
              <input value={skuPreview} disabled aria-label={t("sku")} title={skuPreview} className={cn(INPUT_CLASS, "pr-16")} />
            ) : (
              <input
                {...register(`variants.${index}.sku`)}
                aria-label={t("sku")}
                aria-invalid={Boolean(rowErrors?.sku)}
                placeholder={t("skuPlaceholder")}
                className={cn(INPUT_CLASS, "pr-16 uppercase placeholder:normal-case")}
              />
            )}
          </FieldToggle>
        </VariantCell>

        <VariantCell label={`${t("price")} *`}>
          <FieldToggle label={t("useBasePrice")} pressed={useBasePrice} onToggle={toggleBasePrice}>
            {useBasePrice ? (
              <input
                value={Number.isFinite(basePrice) ? formatVnd(basePrice, locale) : ""}
                disabled
                aria-label={t("price")}
                className={cn(INPUT_CLASS, "pr-[72px]")}
              />
            ) : (
              <input
                {...register(`variants.${index}.price`, { setValueAs: toOptionalNumber })}
                type="number"
                min={1}
                aria-label={t("price")}
                aria-invalid={Boolean(rowErrors?.price)}
                placeholder={t("pricePlaceholder")}
                className={cn(INPUT_CLASS, "pr-[72px]")}
              />
            )}
          </FieldToggle>
        </VariantCell>

        <VariantCell label={`${t("stock")} *`}>
          <input
            {...register(`variants.${index}.stock`, { valueAsNumber: true })}
            type="number"
            min={0}
            aria-label={t("stock")}
            aria-invalid={Boolean(rowErrors?.stock)}
            className={INPUT_CLASS}
          />
        </VariantCell>

        <button
          type="button"
          aria-label={t("remove")}
          onClick={onRemove}
          className="col-span-2 grid h-9 cursor-pointer place-items-center rounded-lg text-[#71717A] transition-colors hover:bg-rose-50 hover:text-rose-700 sm:col-span-1"
        >
          <Trash2 size={15} />
        </button>
      </div>
      {message && <p className="mt-1 text-xs text-rose-700">{notify.translateError(message)}</p>}
      {!message && sizeOutsideChart && <p className="mt-1 text-xs text-amber-700">{t("sizeNotInChart", { size })}</p>}
    </div>
  );
}

/** Bảng nhập SKU: size, màu, mã, giá riêng, tồn kho */
export function ProductVariantsField({
  form,
  sizeOptions,
}: {
  form: UseFormReturn<ProductFormValues>;
  /** Ký hiệu size trong bảng size đang áp dụng — gợi ý khi nhập và cảnh báo khi lệch */
  sizeOptions: string[];
}) {
  const t = useTranslations("AdminPage.products.variant");
  const notify = useNotify();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "variants", keyName: "fieldKey" });
  const collectionError = form.formState.errors.collectionCode?.message;

  return (
    <div className="space-y-2">
      <label className="block sm:max-w-xs">
        <span className="mb-1 block text-xs font-medium text-[#3F3F46]">{t("collectionCode")}</span>
        <input
          {...form.register("collectionCode")}
          aria-invalid={Boolean(collectionError)}
          placeholder={t("collectionCodePlaceholder")}
          className={cn(INPUT_CLASS, "uppercase placeholder:normal-case")}
        />
        {collectionError && <span className="mt-1 block text-xs text-rose-700">{notify.translateError(collectionError)}</span>}
      </label>

      {sizeOptions.length > 0 && (
        <datalist id={SIZE_LIST_ID}>
          {sizeOptions.map((label) => (
            <option key={label} value={label} />
          ))}
        </datalist>
      )}

      {fields.length > 0 && (
        <div className={cn(ROW_GRID_CLASS, "hidden pt-2 text-xs font-medium text-[#71717A] sm:grid")}>
          <span>{t("size")} *</span>
          <span>{t("color")}</span>
          <span>{t("sku")} *</span>
          <span>{t("price")} *</span>
          <span>{t("stock")} *</span>
          <span />
        </div>
      )}

      {fields.map((field, index) => (
        <VariantRow
          key={field.fieldKey}
          form={form}
          index={index}
          sizeOptions={sizeOptions}
          onRemove={() => remove(index)}
        />
      ))}

      <button
        type="button"
        onClick={() => append({ skuAuto: true, sku: "", size: "", color: "", useBasePrice: true, price: null, stock: 0 })}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm font-medium text-[#3F3F46] transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B]"
      >
        <Plus size={15} aria-hidden /> {t("add")}
      </button>
      <p className="text-xs text-[#71717A]">{t("hint")}</p>
    </div>
  );
}
