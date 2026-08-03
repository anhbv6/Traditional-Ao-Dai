import { productCatalog, type MockProduct } from "../types/products.types";
import { mockDetailProducts } from "../types/products.types";

/**
 * Fetch all products in the catalog
 */
export const fetchProducts = async (): Promise<MockProduct[]> => {
  return Promise.resolve(productCatalog);
};

/**
 * Fetch a single product by its id/slug
 */
export const fetchProductById = async (id: string): Promise<MockProduct | null> => {
  const product = productCatalog.find((item) => item.id === id);
  return Promise.resolve(product || null);
};

/**
 * Fetch details product from mock detailed data by slug
 */
export const fetchProductDetailBySlug = async (slug: string) => {
  if (slug in mockDetailProducts) {
    return Promise.resolve(mockDetailProducts[slug]);
  }
  return Promise.resolve(null);
};
