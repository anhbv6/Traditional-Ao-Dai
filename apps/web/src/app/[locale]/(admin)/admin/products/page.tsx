import React from "react";
import { getAdminProductsListQuery, ProductsList } from "@/features/admin/products";
import { Shirt } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProductsListQuery();

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E4E4E7] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Shirt size={14} /> Danh mục & Bộ sưu tập
          </div>
          <h2 className="text-2xl font-bold text-[#09090B] tracking-tight mt-1">
            Sản Phẩm Áo Dài
          </h2>
        </div>
        <div className="text-xs text-zinc-500">
          Tổng cộng <span className="font-mono font-bold text-zinc-900">{products.length}</span> mẫu thiết kế
        </div>
      </div>

      <ProductsList initialProducts={products} />
    </div>
  );
}
