"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useLenis } from "lenis/react";
import { type GridSize, type SortKey, type Locale } from "../types/products.types";
import { productCatalog } from "../data/mockProducts";
import { maxPrice, matchCollection } from "../components/FilterSidebar";
import { scoreProduct } from "../utils/search";

const pageSizeMap: Record<GridSize, number> = {
  3: 15,
  4: 16,
  5: 20,
};

export function useProducts(initialCategory?: string, initialQuery = "") {
  const locale = useLocale() as Locale;
  // Từ khóa ban đầu lấy từ `?q=` (ô tìm kiếm trên header)
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Mặc định hiển thị toàn bộ sản phẩm — khách tự thu hẹp bằng bộ lọc
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );

  const [selectedPurchaseTypes, setSelectedPurchaseTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [priceLimit, setPriceLimit] = useState(maxPrice);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [currentPage, setCurrentPage] = useState(1);
  const productListTopRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const pageSize = pageSizeMap[gridSize];

  const filteredProducts = useMemo(() => {
    const filtered = productCatalog.filter((product) => {
      // Không phân biệt dấu, tìm cả tên / mô tả / chất liệu / danh mục / màu / hình thức mua (dùng chung với header)
      const searchMatch = !searchQuery.trim() || scoreProduct(product, searchQuery, locale) > 0;
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const collectionMatch =
        selectedCollections.length === 0 ||
        selectedCollections.some((colId) => matchCollection(product, colId));
      const purchaseMatch = selectedPurchaseTypes.length === 0 || selectedPurchaseTypes.includes(product.purchaseType);
      const colorMatch =
        selectedColors.length === 0 || product.colors.some((color) => selectedColors.some((selected) => color.name.includes(selected)));
      const materialMatch = selectedMaterials.length === 0 || selectedMaterials.includes(product.material);

      return searchMatch && categoryMatch && collectionMatch && purchaseMatch && colorMatch && materialMatch && product.numericPrice <= priceLimit;
    });

    return filtered.sort((a, b) => {
      if (sortKey === "priceAsc") return a.numericPrice - b.numericPrice;
      if (sortKey === "priceDesc") return b.numericPrice - a.numericPrice;
      if (sortKey === "bestSeller") return b.popularity - a.popularity;
      if (sortKey === "favorite") return b.liked - a.liked;
      return b.id.localeCompare(a.id);
    });
  }, [priceLimit, searchQuery, selectedCategories, selectedCollections, selectedColors, selectedMaterials, selectedPurchaseTypes, sortKey, locale]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const visibleProducts = useMemo(() => filteredProducts.slice(pageStart, pageStart + pageSize), [filteredProducts, pageStart, pageSize]);

  const scrollToProductListTop = useCallback(() => {
    window.requestAnimationFrame(() => {
      const productListTop = productListTopRef.current;

      if (!productListTop) return;

      if (lenis) {
        lenis.scrollTo(productListTop, {
          duration: 1.1,
          // Chừa chỗ cho header dính (80px) — thanh tìm kiếm ghim ngay bên dưới
          offset: -80,
        });
        return;
      }

      productListTop.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [lenis]);

  // Đến từ CTA banner sự kiện (`?category=...#product-list`): cuộn tới danh sách một lần sau khi dựng.
  // Chỉ là hiệu ứng cuộn (không đồng bộ state); ref chặn chạy lại khi `lenis` khởi tạo xong muộn.
  const hasScrolledToHash = useRef(false);
  useEffect(() => {
    if (hasScrolledToHash.current || window.location.hash !== "#product-list") return;
    hasScrolledToHash.current = true;
    scrollToProductListTop();
  }, [scrollToProductListTop]);

  const resetPageAndScroll = useCallback(() => {
    setCurrentPage(1);
    scrollToProductListTop();
  }, [scrollToProductListTop]);

  const setPageAndScroll = useCallback((page: number) => {
    setCurrentPage(page);
    scrollToProductListTop();
  }, [scrollToProductListTop]);

  const toggleValue = (value: string, values: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    resetPageAndScroll();
  };

  /** Số nhóm lọc đang bật (không tính ô tìm kiếm) — dùng để hiện nút "Xóa tất cả" */
  const activeFilterCount =
    selectedCategories.length +
    selectedCollections.length +
    selectedPurchaseTypes.length +
    selectedColors.length +
    selectedMaterials.length +
    (priceLimit < maxPrice ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedCollections([]);
    setSelectedPurchaseTypes([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setPriceLimit(maxPrice);
    resetPageAndScroll();
  };

  return {
    locale,
    searchQuery,
    setSearchQuery,
    selectedCategories,
    setSelectedCategories,
    selectedCollections,
    setSelectedCollections,
    selectedPurchaseTypes,
    setSelectedPurchaseTypes,
    selectedColors,
    setSelectedColors,
    selectedMaterials,
    setSelectedMaterials,
    priceLimit,
    setPriceLimit,
    sortKey,
    setSortKey,
    gridSize,
    setGridSize,
    currentPage,
    setCurrentPage,
    productListTopRef,
    filteredProducts,
    visibleProducts,
    pageCount,
    safePage,
    pageSize,
    resetPageAndScroll,
    setPageAndScroll,
    toggleValue,
    activeFilterCount,
    clearFilters,
  };
}
