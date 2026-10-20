"use client";

import { usePathname } from "@/i18n/routing";

/**
 * Trang có thanh cố định ở đáy màn hình trên mobile / tablet (bộ lọc cửa hàng, tổng giỏ hàng, thanh mua nhanh ở
 * chi tiết sản phẩm, thanh bước của trang may đo) — các nút nổi góc dưới (cuộn lên đầu, chat) đẩy lên để không đè.
 */
export function useHasBottomBar(): boolean {
  const pathname = usePathname();
  return pathname === "/products" || pathname.startsWith("/products/") || pathname === "/cart" || pathname === "/custom";
}
