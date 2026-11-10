"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { PackageCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PRODUCT_GROUP_TRAITS } from "@repo/shared/sizing";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  ADMIN_INPUT_CLASS,
  AdminDialog,
  AdminSegmentedControl,
  AdminTextField,
} from "@/features/admin/core/ui";
import { adjustProductStockAction } from "../../actions/inventory.actions";
import { STOCK_ADJUST_REASONS, type AdminSkuProduct, type StockAdjustReason } from "../../types/inventory.types";
import { REASON_MODE, applyStockInput, colorKey, colorRows, parseUnits, sortSizes } from "../../utils/skuStock";
import { ColorDot, SkuProductThumb, useSizeLabel } from "../shared/SkuParts";

interface StockAdjustDialogProps {
  product: AdminSkuProduct;
  sizeOrder: string[];
  initialReason: StockAdjustReason;
  onOpenChange: (open: boolean) => void;
  /** Gọi khi lưu xong với tồn mới của các SKU đã đổi */
  onSaved: (updated: { id: string; stock: number; updatedAt: string }[]) => void;
}

/**
 * Điều chỉnh tồn một sản phẩm bằng ma trận màu × size. Lý do quyết định nghĩa của ô nhập:
 * nhập hàng / khách trả = cộng thêm, bán tại tiệm / hỏng = trừ đi, kiểm kê = số đếm thực tế.
 * Mỗi ô hiện tồn hiện tại → sau khi lưu; ô bỏ trống thì giữ nguyên.
 */
export function StockAdjustDialog({ product, sizeOrder, initialReason, onOpenChange, onSaved }: StockAdjustDialogProps) {
  const t = useTranslations("AdminPage.inventory");
  const locale = useLocale();
  const notify = useNotify();
  const sizeLabel = useSizeLabel();
  const [reason, setReason] = useState<StockAdjustReason>(initialReason);
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const mode = REASON_MODE[reason];
  const unit = PRODUCT_GROUP_TRAITS[product.group].sellUnit === "METER" ? "METER" : "PIECE";
  const sizes = sortSizes(
    product.variants.map((variant) => variant.size),
    sizeOrder
  );
  const colors = colorRows(product);
  const variantAt = (key: string, size: string) =>
    product.variants.find((variant) => colorKey(variant) === key && variant.size === size);

  const changes = product.variants.flatMap((variant) => {
    const raw = values[variant.id] ?? "";
    const parsed = parseUnits(raw);
    const next = applyStockInput(variant.stock, reason, parsed);
    return next === null || next === variant.stock ? [] : [{ variant, next, invalid: next < 0 }];
  });
  const invalidCells = product.variants.filter((variant) => (values[variant.id] ?? "").trim() && parseUnits(values[variant.id]) === null);
  const hasError = invalidCells.length > 0 || changes.some((change) => change.invalid);
  const netDelta = changes.reduce((sum, change) => sum + change.next - change.variant.stock, 0);

  const mutation = useMutation({
    mutationFn: () =>
      adjustProductStockAction({
        productId: product.id,
        reason,
        note: note.trim() || undefined,
        changes: changes.map((change) => ({ variantId: change.variant.id, stock: change.next })),
      }),
    onSuccess: (res) => {
      if (!res.success) {
        notify.error(res.error, "INVENTORY_UPDATE_FAILED");
        return;
      }
      notify.success(t("adjust.saved", { count: changes.length }));
      onSaved(res.data);
    },
    onError: () => notify.error("INVENTORY_UPDATE_FAILED"),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (changes.length === 0 || hasError) return;
    mutation.mutate();
  };

  const productName = locale === "en" && product.nameEn ? product.nameEn : product.name;

  return (
    <AdminDialog
      open
      onOpenChange={onOpenChange}
      icon={PackageCheck}
      title={t("adjust.title")}
      description={t(`adjust.mode.${mode}`)}
      size="2xl"
      onSubmit={handleSubmit}
      footer={
        <>
          <p className="mr-auto text-xs text-[#71717A]">
            {changes.length === 0
              ? t("adjust.noChanges")
              : t("adjust.summary", { count: changes.length, delta: `${netDelta > 0 ? "+" : netDelta < 0 ? "−" : "±"}${Math.abs(netDelta)}` })}
          </p>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={changes.length === 0 || hasError || mutation.isPending}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {mutation.isPending ? t("processing") : t("adjust.submit")}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <SkuProductThumb image={product.image} className="w-10" />
          <div className="min-w-0">
            <p className="truncate text-body font-medium text-[#09090B]">{productName}</p>
            <p className="font-mono text-2xs text-[#71717A]">{product.code}</p>
          </div>
        </div>

        <div className="-mx-1 overflow-x-auto px-1">
          <AdminSegmentedControl
            value={reason}
            onChange={(next) => {
              setReason(next);
              setValues({});
            }}
            options={STOCK_ADJUST_REASONS.map((value) => ({ value, label: t(`reason.${value}`) }))}
          />
        </div>

        {/* Ma trận màu × size — cột màu dính trái để cuộn ngang trên điện thoại vẫn biết đang ở hàng nào */}
        <div className="overflow-x-auto rounded-xl border border-[#E4E4E7]">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-b border-dashed border-[#E4E4E7] bg-white px-3 py-2.5 text-left font-medium text-[#71717A]">
                  {t("adjust.color")}
                </th>
                {sizes.map((size) => (
                  <th key={size} className="border-b border-dashed border-[#E4E4E7] px-2 py-2.5 text-center font-semibold text-[#3F3F46]">
                    {sizeLabel(size)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colors.map((color, rowIndex) => (
                <tr key={color.key}>
                  <th
                    scope="row"
                    className={cn(
                      "sticky left-0 z-10 bg-white px-3 py-2.5 text-left font-normal text-[#3F3F46]",
                      rowIndex < colors.length - 1 && "border-b border-dashed border-[#E4E4E7]"
                    )}
                  >
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <ColorDot hex={color.hex} />
                      {color.name ?? t("noColor")}
                    </span>
                  </th>
                  {sizes.map((size) => {
                    const variant = variantAt(color.key, size);
                    const cellBorder = rowIndex < colors.length - 1 && "border-b border-dashed border-[#E4E4E7]";
                    if (!variant) {
                      return (
                        <td key={size} className={cn("px-2 py-2.5 text-center text-[#D4D4D8]", cellBorder)}>
                          —
                        </td>
                      );
                    }
                    const raw = values[variant.id] ?? "";
                    const next = applyStockInput(variant.stock, reason, parseUnits(raw));
                    const invalid = (raw.trim() !== "" && parseUnits(raw) === null) || (next !== null && next < 0);
                    return (
                      <td key={size} className={cn("px-1.5 py-2 text-center align-top", cellBorder)}>
                        <input
                          value={raw}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, [variant.id]: event.target.value.replace(/\D/g, "") }))
                          }
                          inputMode="numeric"
                          aria-label={t("adjust.cellLabel", { sku: variant.sku })}
                          aria-invalid={invalid || undefined}
                          placeholder={mode === "SET" ? String(variant.stock) : "0"}
                          className={cn(ADMIN_INPUT_CLASS, "mx-auto h-9 w-16 px-1 text-center font-mono tabular-nums")}
                        />
                        <p
                          className={cn(
                            "mt-1 whitespace-nowrap font-mono text-2xs tabular-nums",
                            invalid ? "text-rose-600" : next !== null && next !== variant.stock ? "text-[#09090B]" : "text-[#A1A1AA]"
                          )}
                        >
                          {variant.stock}
                          {next !== null && next !== variant.stock && ` → ${next}`}
                        </p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasError && <p className="-mt-3 text-xs text-rose-600">{t("adjust.negative")}</p>}

        <AdminTextField
          label={t("adjust.note")}
          hint={t("adjust.noteHint")}
          value={note}
          onValueChange={setNote}
          maxLength={200}
          placeholder={t(`adjust.notePlaceholder.${reason}`)}
        />
        {unit === "METER" && <p className="-mt-3 text-xs text-[#71717A]">{t("adjust.meterUnit")}</p>}
      </div>
    </AdminDialog>
  );
}
