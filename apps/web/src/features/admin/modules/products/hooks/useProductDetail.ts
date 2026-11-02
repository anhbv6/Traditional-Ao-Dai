"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductDetailAction } from "../actions/products.actions";

export const productDetailKey = (productId: string) => ["admin-product", productId];

/** Đọc chi tiết sản phẩm cho dialog xem/sửa; `productId` null thì không gọi */
export function useProductDetail(productId: string | null) {
  return useQuery({
    queryKey: productDetailKey(productId ?? ""),
    enabled: Boolean(productId),
    queryFn: async () => {
      const res = await getProductDetailAction(productId ?? "");
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });
}
