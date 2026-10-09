"use client";

import React, { useState, useTransition } from "react";
import { type AdminInventoryVariant } from "../types/inventory.types";
import { updateVariantStockAction } from "../actions/inventory.actions";
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Check,
  X,
} from "lucide-react";

interface InventoryListProps {
  initialVariants: AdminInventoryVariant[];
}

export function InventoryList({ initialVariants }: InventoryListProps) {
  const [variants, setVariants] = useState<AdminInventoryVariant[]>(initialVariants);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStockVal, setEditStockVal] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  const filtered = variants.filter((v) => {
    return (
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.size.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSaveStock = (variantId: string) => {
    startTransition(async () => {
      const res = await updateVariantStockAction(variantId, editStockVal);
      if (res.success) {
        setVariants((prev) =>
          prev.map((v) => (v.id === variantId ? { ...v, stock: editStockVal } : v))
        );
        setEditingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top filter */}
      <div className="bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên sản phẩm, size..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-[#E4E4E7] rounded-lg text-sm focus:outline-none focus:border-zinc-900 transition-colors"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] bg-zinc-50/50 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4">Tên Áo Dài</th>
                <th className="py-3 px-4">Kích cỡ (Size)</th>
                <th className="py-3 px-4">Màu sắc</th>
                <th className="py-3 px-4">Tồn kho hiện tại</th>
                <th className="py-3 px-4">Trạng thái kho</th>
                <th className="py-3 px-4 text-right">Điều chỉnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#71717A]">
                    <Boxes className="mx-auto size-8 text-zinc-300 mb-2" />
                    Không tìm thấy biến thể nào trong kho.
                  </td>
                </tr>
              ) : (
                filtered.map((variant) => {
                  const isLowStock = variant.stock <= 3;
                  const isOutOfStock = variant.stock === 0;

                  return (
                    <tr key={variant.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-[#09090B]">
                        {variant.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#09090B] line-clamp-1">
                          {variant.productName}
                        </div>
                        <div className="text-xs text-zinc-400">{variant.categoryName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-800">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 border border-[#E4E4E7] text-xs font-semibold">
                          {variant.size}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 text-xs">
                        {variant.color || "Tiêu chuẩn"}
                      </td>
                      <td className="py-3.5 px-4">
                        {editingId === variant.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={editStockVal}
                              onChange={(e) => setEditStockVal(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-white border border-zinc-900 rounded text-sm font-mono font-bold"
                            />
                            <button
                              disabled={isPending}
                              onClick={() => handleSaveStock(variant.id)}
                              className="p-1 rounded bg-[#18181B] text-white hover:bg-black cursor-pointer"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-sm text-[#09090B]">
                            {variant.stock} cái
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle size={11} /> Hết hàng
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle size={11} /> Sắp hết
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Sẵn sàng
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {editingId !== variant.id && (
                          <button
                            onClick={() => {
                              setEditingId(variant.id);
                              setEditStockVal(variant.stock);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:text-[#09090B] bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 size={12} /> Sửa kho
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
