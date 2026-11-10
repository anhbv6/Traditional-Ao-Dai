"use client";

import { useState } from "react";
import { AlertTriangle, Ban, MoreHorizontal, RotateCcw, Undo2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminDataTable,
  AdminInfoTip,
  AdminSearchInput,
  AdminSegmentedControl,
  AdminTooltip,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { type AdminSaleEvent, type SaleCatalogProduct, type SaleDiscountType, type SaleProductRule } from "../../types/saleEvents.types";
import { DEEP_DISCOUNT_PERCENT, computeSalePrice, discountPercent, exclusionReason, type ExclusionReason } from "../../utils/saleRules";
import { ProductThumb, QuotaMeter } from "../shared/SaleParts";

type RowFilter = "ALL" | "WARN" | "EXCLUDED";

export interface SaleProductRow {
  product: SaleCatalogProduct;
  rule: SaleProductRule | undefined;
  excluded: ExclusionReason;
  salePrice: number;
  percent: number;
  conflicts: AdminSaleEvent[];
  warnings: ("CONFLICT" | "DEEP" | "NO_DISCOUNT" | "OUT_OF_STOCK")[];
}

/** Dựng dòng bảng + cảnh báo cho từng sản phẩm trong phạm vi — dùng chung cho thẻ này và bảng kiểm tra bên phải */
export function buildProductRows(
  products: SaleCatalogProduct[],
  event: Pick<AdminSaleEvent, "excludeCustom" | "excludedProductIds" | "productRules">,
  rule: { discountType: SaleDiscountType; value: number },
  conflicts: Map<string, AdminSaleEvent[]>
): SaleProductRow[] {
  return products.map((product) => {
    const productRule = event.productRules[product.id];
    const excluded = exclusionReason(product, event);
    const salePrice = computeSalePrice(product.basePrice, rule, productRule?.overridePrice ?? null);
    const percent = discountPercent(product.basePrice, salePrice);
    const productConflicts = conflicts.get(product.id) ?? [];
    const warnings: SaleProductRow["warnings"] = [];
    if (!excluded) {
      if (productConflicts.length > 0) warnings.push("CONFLICT");
      if (percent > DEEP_DISCOUNT_PERCENT) warnings.push("DEEP");
      // Chưa nhập mức giảm thì chưa cảnh báo "không được giảm" (tránh cả bảng vàng ngay khi mới tạo)
      if (salePrice >= product.basePrice && (rule.value > 0 || productRule?.overridePrice != null)) warnings.push("NO_DISCOUNT");
      if (product.stock === 0) warnings.push("OUT_OF_STOCK");
    }
    return { product, rule: productRule, excluded, salePrice, percent, conflicts: productConflicts, warnings };
  });
}

const digits = (raw: string) => (raw.replace(/\D/g, "") ? Number(raw.replace(/\D/g, "")) : null);

/**
 * Bảng sản phẩm của chương trình: giá gốc → giá sale (tự tính, đặt tay được từng món), % giảm, suất sale & đã bán, tồn.
 * Sản phẩm bị loại vẫn hiện (mờ, ghi lý do) để thấy đủ phạm vi và đưa lại bằng một chạm.
 */
export function SaleProductsCard({
  rows,
  readOnly,
  showSold,
  onRuleChange,
  onToggleExcluded,
}: {
  rows: SaleProductRow[];
  readOnly: boolean;
  /** Chương trình đã chạy → hiện số đã bán trong cột suất */
  showSold: boolean;
  onRuleChange: (productId: string, change: Partial<SaleProductRule>) => void;
  onToggleExcluded: (productId: string, exclude: boolean) => void;
}) {
  const t = useTranslations("AdminPage.saleEvents");
  const locale = useLocale() as Locale;
  const [filter, setFilter] = useState<RowFilter>("ALL");
  const [search, setSearch] = useState("");

  const warnCount = rows.filter((row) => row.warnings.length > 0).length;
  const excludedCount = rows.filter((row) => row.excluded).length;
  const keyword = search.trim().toLowerCase();
  const visible = rows.filter(
    (row) =>
      (filter === "ALL" || (filter === "WARN" ? row.warnings.length > 0 : Boolean(row.excluded))) &&
      (!keyword || `${row.product.name} ${row.product.code}`.toLowerCase().includes(keyword))
  );
  const number = (value: number) => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(value);

  const menu = (row: SaleProductRow): AppMenuEntry[] => {
    const items: AppMenuEntry[] = [];
    if (row.rule?.overridePrice != null)
      items.push({ key: "reset", label: t("products.menu.resetPrice"), icon: RotateCcw, onSelect: () => onRuleChange(row.product.id, { overridePrice: null }) });
    if (row.excluded === "MANUAL")
      items.push({ key: "include", label: t("products.menu.include"), icon: Undo2, onSelect: () => onToggleExcluded(row.product.id, false) });
    else if (!row.excluded)
      items.push({ key: "exclude", label: t("products.menu.exclude"), icon: Ban, tone: "danger", onSelect: () => onToggleExcluded(row.product.id, true) });
    if (row.excluded === "CUSTOM")
      items.push({ key: "custom", label: t("products.menu.customLocked"), description: t("products.menu.customLockedHint"), icon: Ban, disabled: true });
    return items;
  };

  const productCell = (row: SaleProductRow) => (
    <div className={cn("flex min-w-0 items-center gap-3", row.excluded && "opacity-55")}>
      <ProductThumb product={row.product} />
      <div className="min-w-0">
        <p className={cn("truncate text-[#09090B]", row.excluded && "line-through decoration-[#A1A1AA]")}>{row.product.name}</p>
        <p className="mt-0.5 truncate text-xs text-[#71717A]">
          <span className="font-mono text-2xs">{row.product.code}</span> · {row.product.categoryName}
          {row.product.saleMode === "CUSTOM" && ` · ${t("products.custom")}`}
        </p>
        {row.excluded && <p className="mt-0.5 text-xs text-[#71717A]">{t(`products.excluded.${row.excluded}`)}</p>}
        {row.warnings.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {row.warnings.map((warning) => (
              <span key={warning} className="inline-flex items-center gap-1 text-xs text-amber-700">
                <AlertTriangle size={12} aria-hidden />
                {warning === "CONFLICT" ? t("products.warning.CONFLICT", { names: row.conflicts.map((event) => event.name).join(", ") }) : t(`products.warning.${warning}`)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const priceInput = (row: SaleProductRow) => (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        aria-label={t("products.salePriceFor", { name: row.product.name })}
        disabled={readOnly || Boolean(row.excluded)}
        value={row.rule?.overridePrice != null ? number(row.rule.overridePrice) : ""}
        placeholder={number(row.salePrice)}
        onChange={(event) => {
          const value = digits(event.target.value);
          onRuleChange(row.product.id, { overridePrice: value === null ? null : Math.min(value, row.product.basePrice) });
        }}
        className={cn(ADMIN_INPUT_CLASS, "h-9 pr-7 text-right font-mono tabular-nums placeholder:text-[#3F3F46]", row.rule?.overridePrice != null && "border-[#18181B]")}
      />
      <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A1A1AA]">
        ₫
      </span>
    </div>
  );

  const priceCell = (row: SaleProductRow) => (
    <div className="space-y-1">
      {priceInput(row)}
      <p className="text-right text-xs text-[#71717A]">
        <span className="font-mono tabular-nums line-through">{formatVnd(row.product.basePrice, locale)}</span>
        {row.rule?.overridePrice != null && <span className="ml-1.5 text-[#18181B]">· {t("products.manual")}</span>}
      </p>
    </div>
  );

  const percentCell = (row: SaleProductRow) =>
    row.excluded ? (
      <span className="text-[#D4D4D8]">—</span>
    ) : (
      <span className={cn("font-mono tabular-nums", row.percent > DEEP_DISCOUNT_PERCENT ? "text-amber-700" : row.percent === 0 ? "text-[#A1A1AA]" : "text-[#09090B]")}>
        −{row.percent}%
      </span>
    );

  const quotaCell = (row: SaleProductRow) => (
    <div className="space-y-1">
      <input
        type="text"
        inputMode="numeric"
        aria-label={t("products.quotaFor", { name: row.product.name })}
        disabled={readOnly || Boolean(row.excluded)}
        value={row.rule?.quota != null ? String(row.rule.quota) : ""}
        placeholder="∞"
        onChange={(event) => onRuleChange(row.product.id, { quota: digits(event.target.value) })}
        className={cn(ADMIN_INPUT_CLASS, "h-9 text-center font-mono tabular-nums")}
      />
      {showSold && row.rule && row.rule.sold > 0 && <QuotaMeter sold={row.rule.sold} quota={row.rule.quota} className="text-center [&_span]:mx-auto" />}
    </div>
  );

  const stockCell = (row: SaleProductRow) =>
    row.product.stock === null ? (
      <span className="text-xs text-[#71717A]">{t("products.madeToOrder")}</span>
    ) : (
      <span className={cn("font-mono tabular-nums", row.product.stock === 0 ? "text-rose-600" : row.product.stock <= 5 ? "text-amber-700" : "text-[#3F3F46]")}>{row.product.stock}</span>
    );

  const columns: AdminTableColumn<SaleProductRow>[] = [
    { key: "product", header: t("products.column.product"), cell: productCell },
    { key: "price", header: t("products.column.salePrice"), className: "w-40", align: "right", cell: priceCell },
    { key: "percent", header: t("products.column.percent"), className: "hidden w-16 @2xl:table-cell", align: "right", cell: percentCell },
    { key: "quota", header: <span className="inline-flex items-center gap-1">{t("products.column.quota")}<AdminInfoTip content={t("products.quotaHint")} /></span>, className: "hidden w-24 @3xl:table-cell", cell: quotaCell },
    { key: "stock", header: t("products.column.stock"), className: "hidden w-20 @4xl:table-cell", align: "right", cell: stockCell },
  ];

  return (
    <div className="space-y-3">
      <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#09090B]">{t("products.title")}</h2>
            <p className="mt-0.5 text-xs text-[#71717A]">{t("products.subtitle")}</p>
          </div>
          {rows.length > 0 && (
            <AdminSegmentedControl<RowFilter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "ALL", label: t("products.filter.ALL", { count: rows.length }) },
                { value: "WARN", label: t("products.filter.WARN", { count: warnCount }) },
                { value: "EXCLUDED", label: t("products.filter.EXCLUDED", { count: excludedCount }) },
              ]}
            />
          )}
        </header>
        {rows.length > 8 && <AdminSearchInput value={search} onChange={setSearch} placeholder={t("products.search")} className="mt-3 sm:max-w-72" />}
      </section>

      {rows.length === 0 ? (
        <section className={cn(ADMIN_CARD_CLASS, "py-12 text-center text-sm text-[#71717A]")}>{t("products.emptyScope")}</section>
      ) : (
        <AdminDataTable
          rows={visible}
          columns={columns}
          getRowId={(row) => row.product.id}
          rowActions={
            readOnly
              ? undefined
              : (row) => {
                  const items = menu(row);
                  return items.length === 0 ? null : (
                    <AppMenu
                      tone="admin"
                      width={240}
                      align="end"
                      sideOffset={4}
                      items={items}
                      trigger={
                        <button type="button" aria-label={t("products.menu.label", { name: row.product.name })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                          <MoreHorizontal size={18} />
                        </button>
                      }
                    />
                  );
                }
          }
          actionsLabel={t("column.actions")}
          minWidth={520}
          empty={t("products.emptyFilter")}
          mobileRow={(row) => (
            // Nút ⋯ do AdminDataTable tự đặt cạnh dòng gọn — ở đây chỉ dựng nội dung
            <div className="space-y-3">
              {productCell(row)}
              {!row.excluded && (
                <div className="grid grid-cols-[minmax(0,1fr)_96px] items-start gap-3">
                  <div>
                    <p className="mb-1 flex items-center justify-between text-xs text-[#71717A]">
                      <span>{t("products.column.salePrice")}</span>
                      {percentCell(row)}
                    </p>
                    {priceCell(row)}
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-[#71717A]">{t("products.column.quota")}</p>
                    {quotaCell(row)}
                  </div>
                </div>
              )}
            </div>
          )}
        />
      )}
      {!readOnly && rows.some((row) => !row.excluded) && (
        <p className="px-1 text-xs text-[#A1A1AA]">
          <AdminTooltip content={t("products.roundingHint")}>
            <span tabIndex={0} className="cursor-help underline decoration-dotted underline-offset-2">
              {t("products.rounding")}
            </span>
          </AdminTooltip>
        </p>
      )}
    </div>
  );
}
