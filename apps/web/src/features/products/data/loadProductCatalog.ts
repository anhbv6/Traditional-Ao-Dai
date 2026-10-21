/**
 * Nạp danh mục sản phẩm khi thật sự cần (vd. lần đầu mở ô tìm kiếm trên header).
 * `import()` tách dữ liệu mock thành chunk riêng → không nằm trong bundle chung của mọi trang.
 */
export const loadProductCatalog = () => import("./mockProducts").then((module) => module.productCatalog);
