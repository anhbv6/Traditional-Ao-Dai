"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Boxes, ClipboardCheck, ExternalLink, MoreHorizontal, PackagePlus, ShoppingBag } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { PRODUCT_GROUPS, PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDataTable,
  AdminFilterSelect,
  AdminListPanel,
  AdminSegmentedControl,
  AdminStatusText,
  type AdminStatusTone,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import {
  type AdminSkuProduct,
  type AdminSkuStockData,
  type AdminSkuVariant,
  type SkuProductStatus,
  type SkuStockStatus,
  type StockAdjustReason,
} from "../../types/inventory.types";
import {
  LOW_STOCK_UNITS,
  PRODUCT_STATUS_ORDER,
  SKU_STATUS_ORDER,
  resolveProductStatus,
  resolveSkuStatus,
  sizeSummary,
  totalStock,
} from "../../utils/skuStock";
import { ColorDot, SizeStrip, SkuProductThumb, useSizeLabel } from "../shared/SkuParts";

const StockAdjustDialog = dynamic(() => import("./StockAdjustDialog").then((m) => m.StockAdjustDialog));

type View = "products" | "skus";
type StatusFilter = "ALL" | "ATTENTION" | "OUT" | "OK" | "INACTIVE";

const PRODUCT_TONE: Record<SkuProductStatus, AdminStatusTone> = {
  OK: "success",
  PARTIAL: "warning",
  OUT: "danger",
  INACTIVE: "neutral",
};
const SKU_TONE: Record<SkuStockStatus, AdminStatusTone> = { OK: "success", LOW: "warning", OUT: "danger" };

/** Một dòng ở chế độ xem theo SKU — SKU kèm sản phẩm chứa nó */
interface SkuRow {
  variant: AdminSkuVariant;
  product: AdminSkuProduct;
}

/**
 * Màn tồn kho SKU (hàng may sẵn — SKU may đo không giữ tồn nên không có ở đây).
 * Mặc định gom theo sản phẩm với dải size như sổ ghi tồn ở quầy; chế độ "Theo SKU" để lọc ra từng mã hết / sắp hết.
 * Điều chỉnh tồn mở ma trận màu × size (StockAdjustDialog) — mọi lần lưu ghi AuditLog kèm lý do.
 */
export function SkuStockBoard({ data }: { data: AdminSkuStockData }) {
  const t = useTranslations("AdminPage.inventory");
  const tPage = useTranslations("AdminPage.pages.inventory");
  const tSizing = useTranslations("AdminPage.sizing");
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const sizeLabel = useSizeLabel();
  const [products, setProducts] = useState(data.products);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<"ALL" | ProductGroup>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [view, setView] = useState<View>("products");
  const [adjusting, setAdjusting] = useState<{ productId: string; reason: StockAdjustReason } | null>(null);
  const [now, setNow] = useState(data.now);

  const nameOf = (product: AdminSkuProduct) => (locale === "en" && product.nameEn ? product.nameEn : product.name);
  const categoryOf = (product: AdminSkuProduct) =>
    locale === "en" && product.categoryNameEn ? product.categoryNameEn : product.categoryName;
  const unitOf = (product: AdminSkuProduct) => (PRODUCT_GROUP_TRAITS[product.group].sellUnit === "METER" ? "METER" : "PIECE");

  // ─── Lọc ───────────────────────────────────────────────────────────────────
  const keyword = search.trim().toLowerCase();
  const inGroup = (product: AdminSkuProduct) => group === "ALL" || product.group === group;
  const matchesProduct = (product: AdminSkuProduct) =>
    [product.name, product.nameEn ?? "", product.code].some((value) => value.toLowerCase().includes(keyword));
  const matchesVariant = (variant: AdminSkuVariant) =>
    [variant.sku, variant.colorName ?? "", variant.size].some((value) => value.toLowerCase().includes(keyword));

  const productRows = products
    .filter((product) => inGroup(product))
    .filter((product) => !keyword || matchesProduct(product) || product.variants.some(matchesVariant))
    .filter((product) => {
      const s = resolveProductStatus(product);
      if (status === "ALL") return true;
      if (status === "ATTENTION") return s === "PARTIAL" || s === "OUT";
      return s === status;
    })
    .sort((a, b) => PRODUCT_STATUS_ORDER[resolveProductStatus(a)] - PRODUCT_STATUS_ORDER[resolveProductStatus(b)]);

  const skuRows: SkuRow[] = products
    .filter((product) => inGroup(product))
    .flatMap((product) => product.variants.map((variant) => ({ variant, product })))
    .filter(({ variant, product }) => !keyword || matchesVariant(variant) || matchesProduct(product))
    .filter(({ variant, product }) => {
      if (status === "INACTIVE") return !product.isActive;
      if (!product.isActive) return status === "ALL";
      const s = resolveSkuStatus(variant.stock);
      if (status === "ALL") return true;
      if (status === "ATTENTION") return s !== "OK";
      return s === status;
    })
    .sort((a, b) => SKU_STATUS_ORDER[resolveSkuStatus(a.variant.stock)] - SKU_STATUS_ORDER[resolveSkuStatus(b.variant.stock)] || a.variant.stock - b.variant.stock);

  // Nhắc việc: chỉ tính sản phẩm đang bán
  const activeVariants = products.filter((product) => product.isActive).flatMap((product) => product.variants);
  const outCount = activeVariants.filter((variant) => variant.stock <= 0).length;
  const lowCount = activeVariants.filter((variant) => resolveSkuStatus(variant.stock) === "LOW").length;
  const groupsInUse = PRODUCT_GROUPS.filter((value) => products.some((product) => product.group === value));

  // ─── Thao tác ──────────────────────────────────────────────────────────────
  const adjustingProduct = adjusting ? products.find((product) => product.id === adjusting.productId) : undefined;

  const handleSaved = (updated: { id: string; stock: number; updatedAt: string }[]) => {
    const byId = new Map(updated.map((item) => [item.id, item]));
    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        variants: product.variants.map((variant) => {
          const next = byId.get(variant.id);
          return next ? { ...variant, stock: next.stock, updatedAt: next.updatedAt } : variant;
        }),
      }))
    );
    if (updated[0]) setNow(updated[0].updatedAt);
    setAdjusting(null);
    router.refresh();
  };

  const menuItems = (product: AdminSkuProduct): AppMenuEntry[] => [
    { key: "received", label: t("menu.received"), icon: PackagePlus, onSelect: () => setAdjusting({ productId: product.id, reason: "RECEIVED" }) },
    { key: "sold", label: t("menu.sold"), icon: ShoppingBag, onSelect: () => setAdjusting({ productId: product.id, reason: "SOLD_IN_STORE" }) },
    { key: "stocktake", label: t("menu.stocktake"), icon: ClipboardCheck, onSelect: () => setAdjusting({ productId: product.id, reason: "STOCKTAKE" }) },
    { type: "separator", key: "sep" },
    { key: "product", label: t("menu.openProduct"), icon: ExternalLink, href: `/admin/products/${product.id}` },
  ];

  const rowMenu = (product: AdminSkuProduct, label: string) => (
    <AppMenu
      tone="admin"
      width={232}
      align="end"
      sideOffset={4}
      items={menuItems(product)}
      trigger={
        <button type="button" aria-label={t("menu.label", { name: label })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
          <MoreHorizontal size={18} />
        </button>
      }
    />
  );

  // ─── Ô bảng: theo sản phẩm ─────────────────────────────────────────────────
  const productCell = (product: AdminSkuProduct) => (
    <div className="flex min-w-0 items-center gap-3">
      <SkuProductThumb image={product.image} className={cn(!product.isActive && "opacity-50")} />
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => setAdjusting({ productId: product.id, reason: "RECEIVED" })}
          className="max-w-full cursor-pointer truncate text-left font-medium text-[#09090B] hover:underline"
        >
          {nameOf(product)}
        </button>
        <p className="mt-0.5 truncate text-xs text-[#71717A]">
          <span className="font-mono text-2xs">{product.code}</span> · {categoryOf(product)}
          {group === "ALL" && ` · ${tSizing(`group.${product.group}`)}`}
        </p>
      </div>
    </div>
  );

  const totalCell = (product: AdminSkuProduct) => (
    <span className="whitespace-nowrap">
      <span className="font-mono font-semibold tabular-nums text-[#09090B]">{format.number(totalStock(product))}</span>
      <span className="ml-1 text-xs text-[#71717A]">{t(`unit.${unitOf(product)}`)}</span>
    </span>
  );

  const productStatus = (product: AdminSkuProduct) => {
    const s = resolveProductStatus(product);
    return <AdminStatusText tone={PRODUCT_TONE[s]}>{t(`productStatus.${s}`)}</AdminStatusText>;
  };

  const productColumns: AdminTableColumn<AdminSkuProduct>[] = [
    { key: "product", header: t("column.product"), className: "w-[34%]", cell: productCell },
    {
      key: "sizes",
      header: t("column.sizes"),
      cell: (product) => <SizeStrip sizes={sizeSummary(product, data.sizeOrder)} muted={!product.isActive} />,
    },
    { key: "total", header: t("column.total"), align: "right", className: "w-24", cell: totalCell },
    { key: "status", header: t("column.status"), className: "hidden w-36 whitespace-nowrap lg:table-cell", cell: productStatus },
  ];

  // ─── Ô bảng: theo SKU ──────────────────────────────────────────────────────
  const skuCell = ({ variant, product }: SkuRow) => (
    <div className="min-w-0">
      <p className="font-mono text-2xs font-medium text-[#09090B]">{variant.sku}</p>
      <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-[#71717A]">
        <ColorDot hex={variant.hex} />
        <span className="truncate">
          {[variant.colorName, sizeLabel(variant.size)].filter(Boolean).join(" · ")} — {nameOf(product)}
        </span>
      </p>
    </div>
  );

  const skuStock = ({ variant, product }: SkuRow) => {
    const s = resolveSkuStatus(variant.stock);
    return (
      <span className="whitespace-nowrap">
        <span
          className={cn(
            "font-mono font-semibold tabular-nums",
            s === "OUT" ? "text-rose-600" : s === "LOW" ? "text-amber-700" : "text-[#09090B]"
          )}
        >
          {variant.stock}
        </span>
        <span className="ml-1 text-xs text-[#71717A]">{t(`unit.${unitOf(product)}`)}</span>
      </span>
    );
  };

  const skuStatus = ({ variant, product }: SkuRow) =>
    product.isActive ? (
      <AdminStatusText tone={SKU_TONE[resolveSkuStatus(variant.stock)]}>{t(`skuStatus.${resolveSkuStatus(variant.stock)}`)}</AdminStatusText>
    ) : (
      <AdminStatusText tone="neutral">{t("productStatus.INACTIVE")}</AdminStatusText>
    );

  const skuColumns: AdminTableColumn<SkuRow>[] = [
    { key: "sku", header: t("column.sku"), cell: skuCell },
    { key: "stock", header: t("column.stock"), align: "right", className: "w-28", cell: skuStock },
    { key: "status", header: t("column.status"), className: "w-36 whitespace-nowrap", cell: skuStatus },
    {
      key: "updated",
      header: t("column.updated"),
      className: "hidden w-36 whitespace-nowrap text-[#71717A] lg:table-cell",
      cell: ({ variant }) => format.relativeTime(new Date(variant.updatedAt), new Date(now)),
    },
  ];

  const emptyText = products.length === 0 ? t("empty") : t("noResults");

  return (
    <>
      <AdminListPanel
        icon={Boxes}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        filters={
          <>
            <AdminFilterSelect
              label={t("filter.group")}
              value={group}
              onChange={setGroup}
              options={[
                { value: "ALL" as const, label: t("filter.all") },
                ...groupsInUse.map((value) => ({ value, label: tSizing(`group.${value}`) })),
              ]}
              className="w-full sm:w-52"
            />
            <AdminFilterSelect
              label={t("filter.status")}
              value={status}
              onChange={setStatus}
              options={(["ALL", "ATTENTION", "OUT", "OK", "INACTIVE"] as const).map((value) => ({
                value,
                label: value === "ALL" ? t("filter.all") : t(`filter.statusOption.${value}`),
              }))}
              className="w-full sm:w-56"
            />
          </>
        }
      />

      {/* Một dòng nhắc việc — chỉ hiện khi có SKU đang bán mà hết / sắp hết */}
      {outCount + lowCount > 0 && status !== "ATTENTION" && (
        <div className={cn(ADMIN_CARD_CLASS, "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center")}>
          <span aria-hidden className="hidden size-2 shrink-0 rounded-full bg-amber-500 sm:block" />
          <p className="flex-1 text-sm text-[#3F3F46]">
            {t.rich("notice.text", {
              out: outCount,
              low: lowCount,
              threshold: LOW_STOCK_UNITS,
              b: (chunks) => <strong className="font-semibold text-[#09090B]">{chunks}</strong>,
            })}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("ATTENTION");
              setView("skus");
            }}
            className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "h-8 self-start text-xs sm:self-auto")}
          >
            {t("notice.show")}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#71717A]">
          {view === "products"
            ? t("summaryProducts", { count: productRows.length })
            : t("summarySkus", { count: skuRows.length })}
        </p>
        <AdminSegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: "products", label: t("view.products") },
            { value: "skus", label: t("view.skus") },
          ]}
        />
      </div>

      {view === "products" ? (
        <AdminDataTable
          rows={productRows}
          columns={productColumns}
          getRowId={(product) => product.id}
          rowActions={(product) => rowMenu(product, nameOf(product))}
          actionsLabel={t("column.actions")}
          minWidth={680}
          empty={emptyText}
          mobileRow={(product) => (
            <div className="space-y-3">
              {productCell(product)}
              <SizeStrip sizes={sizeSummary(product, data.sizeOrder)} muted={!product.isActive} />
              <div className="flex items-center justify-between gap-3 text-xs">
                {productStatus(product)}
                {totalCell(product)}
              </div>
            </div>
          )}
        />
      ) : (
        <AdminDataTable
          rows={skuRows}
          columns={skuColumns}
          getRowId={({ variant }) => variant.id}
          rowActions={({ product, variant }) => rowMenu(product, variant.sku)}
          actionsLabel={t("column.actions")}
          minWidth={560}
          empty={emptyText}
          mobileRow={(row) => (
            <div className="space-y-2">
              {skuCell(row)}
              <div className="flex items-center justify-between gap-3 text-xs">
                {skuStatus(row)}
                {skuStock(row)}
              </div>
            </div>
          )}
        />
      )}

      {adjusting && adjustingProduct && (
        <StockAdjustDialog
          key={`${adjusting.productId}-${adjusting.reason}`}
          product={adjustingProduct}
          sizeOrder={data.sizeOrder}
          initialReason={adjusting.reason}
          onOpenChange={(open) => !open && setAdjusting(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
