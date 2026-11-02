"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { type AdminProductItem } from "../types/products.types";
import {
  ProductCheckbox,
  ProductRowMenu,
  ProductStatusBadge,
  ProductStockHint,
  ProductThumb,
} from "./ProductRowParts";

interface ProductsTableProps {
  products: AdminProductItem[];
  selectedIds: Set<string>;
  disabled: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  onView: (product: AdminProductItem) => void;
  onEdit: (product: AdminProductItem) => void;
  onToggleActive: (product: AdminProductItem) => void;
  onToggleCustomFit: (product: AdminProductItem) => void;
}

const TH_CLASS = "whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-[#71717A]";
const TD_CLASS = "px-3 py-2.5";

/** Bảng sản phẩm (từ `md`) và danh sách hàng gọn (màn nhỏ) — dùng chung dữ liệu và thao tác */
export function ProductsTable({
  products,
  selectedIds,
  disabled,
  onSelectAll,
  onSelect,
  onView,
  onEdit,
  onToggleActive,
  onToggleCustomFit,
}: ProductsTableProps) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale() as Locale;

  const selectedCount = products.filter((p) => selectedIds.has(p.id)).length;
  const rowMenuProps = { disabled, onView, onEdit, onToggleActive, onToggleCustomFit };

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="border-b border-[#E4E4E7] bg-[#FAFAFA]">
            <tr>
              <th className="w-10 py-2.5 pl-4 pr-1">
                <span className="flex">
                  <ProductCheckbox
                    checked={selectedCount === products.length}
                    indeterminate={selectedCount > 0 && selectedCount < products.length}
                    onChange={onSelectAll}
                    label={t("selectAll")}
                  />
                </span>
              </th>
              <th className={TH_CLASS}>{t("colProduct")}</th>
              <th className={TH_CLASS}>{t("colCategory")}</th>
              <th className={`${TH_CLASS} hidden xl:table-cell`}>{t("colMaterial")}</th>
              <th className={`${TH_CLASS} text-right`}>{t("colPrice")}</th>
              <th className={`${TH_CLASS} text-right`}>{t("colStock")}</th>
              <th className={`${TH_CLASS} hidden text-right xl:table-cell`}>{t("colSold")}</th>
              <th className={TH_CLASS}>{t("colCustomFit")}</th>
              <th className={TH_CLASS}>{t("colStatus")}</th>
              <th className="w-12 px-3 py-2.5">
                <span className="sr-only">{t("colActions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F5]">
            {products.map((product) => (
              <tr key={product.id} className="transition-colors hover:bg-[#FAFAFA]">
                <td className="py-2.5 pl-4 pr-1">
                  <span className="flex">
                    <ProductCheckbox
                      checked={selectedIds.has(product.id)}
                      onChange={(checked) => onSelect(product.id, checked)}
                      label={t("selectProduct", { name: product.name })}
                    />
                  </span>
                </td>
                <td className={TD_CLASS}>
                  <button
                    type="button"
                    onClick={() => onView(product)}
                    className="group flex cursor-pointer items-center gap-3 text-left outline-none"
                  >
                    <ProductThumb product={product} />
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-medium leading-snug text-[#09090B] group-hover:underline group-focus-visible:underline">
                        {product.name}
                      </span>
                      <span className="block text-xs text-[#71717A]">{t("skuCount", { count: product.variantsCount })}</span>
                    </span>
                  </button>
                </td>
                <td className={`${TD_CLASS} whitespace-nowrap text-[#3F3F46]`}>{product.categoryName ?? t("uncategorized")}</td>
                <td className={`${TD_CLASS} hidden text-[#3F3F46] xl:table-cell`}>{product.material || "—"}</td>
                <td className={`${TD_CLASS} whitespace-nowrap text-right font-medium tabular-nums text-[#09090B]`}>
                  {formatVnd(Number(product.basePrice), locale)}
                </td>
                <td className={`${TD_CLASS} whitespace-nowrap text-right tabular-nums text-[#09090B]`}>
                  <div>{product.totalStock}</div>
                  <ProductStockHint product={product} />
                </td>
                <td className={`${TD_CLASS} hidden text-right tabular-nums text-[#3F3F46] xl:table-cell`}>
                  {product.soldCount}
                </td>
                <td className={`${TD_CLASS} text-[#3F3F46]`}>{product.isCustomFit ? t("yes") : t("no")}</td>
                <td className={TD_CLASS}>
                  <ProductStatusBadge isActive={product.isActive} />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <ProductRowMenu product={product} {...rowMenuProps} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-[#F4F4F5] md:hidden">
        {products.map((product) => (
          <li key={product.id} className="flex items-start gap-3 px-4 py-3">
            <span className="flex h-16 items-center">
              <ProductCheckbox
                checked={selectedIds.has(product.id)}
                onChange={(checked) => onSelect(product.id, checked)}
                label={t("selectProduct", { name: product.name })}
              />
            </span>
            <ProductThumb product={product} className="w-12" />
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onView(product)}
                className="line-clamp-2 cursor-pointer text-left text-sm font-medium leading-snug text-[#09090B]"
              >
                {product.name}
              </button>
              <div className="mt-0.5 truncate text-xs text-[#71717A]">
                {[product.categoryName ?? t("uncategorized"), product.material].filter(Boolean).join(" · ")}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium tabular-nums text-[#09090B]">
                  {formatVnd(Number(product.basePrice), locale)}
                </span>
                <span className="text-xs tabular-nums text-[#71717A]">{t("stockCount", { count: product.totalStock })}</span>
                <ProductStockHint product={product} />
              </div>
              <div className="mt-1.5">
                <ProductStatusBadge isActive={product.isActive} />
              </div>
            </div>
            <ProductRowMenu product={product} {...rowMenuProps} />
          </li>
        ))}
      </ul>
    </>
  );
}
