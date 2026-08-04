import { type DisplayProduct, type RelatedProductItem, type DisplayColor } from "../components/ProductDetailClient";
import { type MockProduct } from "../data/mockProducts";

export type { DisplayProduct, RelatedProductItem, DisplayColor, MockProduct };
export { productCatalog, mockProducts } from "../data/mockProducts";
export { mockDetailProducts } from "../data/detailMockProduct";

export type Locale = "vi" | "en";
export type GridSize = 3 | 4 | 5;
export type SortKey = "all" | "newest" | "priceAsc" | "priceDesc" | "bestSeller" | "favorite";
