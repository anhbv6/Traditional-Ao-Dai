"use client";

import React, { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { type AdminProductItem } from "../types/products.types";
import { toggleProductActiveAction, toggleProductCustomFitAction } from "../actions/products.actions";
import {
  Shirt,
  Search,
  Plus,
  Scissors,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ProductsListProps {
  initialProducts: AdminProductItem[];
}

export function ProductsList({ initialProducts }: ProductsListProps) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale() as Locale;
  const [products, setProducts] = useState<AdminProductItem[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = products.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleToggleActive = (productId: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleProductActiveAction(productId, !current);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isActive: !current } : p))
        );
      }
    });
  };

  const handleToggleCustomFit = (productId: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleProductCustomFitAction(productId, !current);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isCustomFit: !current } : p))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-[#E4E4E7] rounded-lg text-sm focus:outline-none focus:border-zinc-900 transition-colors"
          />
        </div>

        <button
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#18181B] hover:bg-[#09090B] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus size={14} /> {t("add")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] bg-zinc-50/50 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
                <th className="py-3 px-4">{t("colProduct")}</th>
                <th className="py-3 px-4">{t("colCategory")}</th>
                <th className="py-3 px-4">{t("colPrice")}</th>
                <th className="py-3 px-4">{t("colStock")}</th>
                <th className="py-3 px-4">{t("colCustomFit")}</th>
                <th className="py-3 px-4">{t("colStatus")}</th>
                <th className="py-3 px-4 text-right">{t("colSold")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#71717A]">
                    <Shirt className="mx-auto size-8 text-zinc-300 mb-2" />
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-zinc-100 border border-[#E4E4E7] overflow-hidden shrink-0 flex items-center justify-center">
                          {product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Shirt size={18} className="text-zinc-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[#09090B] line-clamp-1">{product.name}</div>
                          <div className="text-xs text-zinc-400 font-mono">/{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-800">{product.categoryName ?? t("uncategorized")}</div>
                      <div className="text-xs text-[#71717A]">{product.material || t("defaultMaterial")}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#09090B]">
                      {formatVnd(Number(product.basePrice), locale)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-medium text-[#09090B]">
                        {t("units", { count: product.totalStock })}
                      </div>
                      <div className="text-xs text-[#71717A]">
                        {t("variantsCount", { count: product.variantsCount })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        disabled={isPending}
                        onClick={() => handleToggleCustomFit(product.id, product.isCustomFit)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          product.isCustomFit
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-zinc-100 text-[#71717A] border-[#E4E4E7]"
                        }`}
                      >
                        <Scissors size={12} />
                        {product.isCustomFit ? t("customFitOn") : t("customFitOff")}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        disabled={isPending}
                        onClick={() => handleToggleActive(product.id, product.isActive)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          product.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {product.isActive ? (
                          <>
                            <CheckCircle size={12} /> {t("active")}
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> {t("hidden")}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-zinc-600">
                      {product.soldCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
