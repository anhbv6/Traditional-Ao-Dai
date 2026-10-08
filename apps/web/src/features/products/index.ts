export * from "./components/ProductsCollection";
export * from "./components/ProductDetailClient";
export * from "./components/ProductDetail";
export * from "./components/ProductBanner";
export * from "./components/ProductCard";
export * from "./types/products.types";
export * from "./hooks/useProducts";
export * from "./hooks/useProductDetail";

// Dữ liệu mock (tạm thời công khai cho trang chi tiết & trang chủ) — thay bằng API khi có module products
export { productCatalog, mockProducts } from "./data/mockProducts";
export { mockDetailProducts } from "./data/detailMockProduct";
