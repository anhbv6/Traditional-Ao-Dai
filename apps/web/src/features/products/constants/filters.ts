import type { MockProduct } from '../data/mockProducts';

/**
 * Cấu hình bộ lọc trang Cửa hàng: khoảng giá, danh mục, màu, chất liệu, bộ sưu tập và khóa URL tương ứng.
 * Dùng chung cho FilterSidebar, ProductCard, ProductsCollection và hook useProducts (đọc bộ lọc từ URL).
 */
export const minPrice = 500000;
export const maxPrice = 5000000;

export const categoryOptions = ['Áo dài Cưới', 'Áo dài Cách tân', 'Áo dài Lễ/Tết', 'Áo dài Trẻ em', 'Phụ kiện'];
export const purchaseOptions = [
  { id: 'ready', label: 'Hàng có sẵn' },
  { id: 'custom', label: 'Nhận may đo riêng' },
];
export const colorOptions = [
  { name: 'Đỏ', hex: '#B32530' },
  { name: 'Vàng', hex: '#D8A928' },
  { name: 'Hồng', hex: '#E2A79E' },
  { name: 'Trắng', hex: '#F7F0E8' },
  { name: 'Lụa trơn', hex: '#C9B29B' },
  { name: 'Gấm thêu', hex: '#B77B3D' },
];
export const materialOptions = ['Lụa Tơ Tằm', 'Gấm', 'Tơ Nhung', 'Voan'];

export const collectionOptions = [
  { id: 'wedding', label: 'Áo Dài Cưới' },
  { id: 'modern', label: 'Áo Dài Cách Tân' },
  { id: 'silk', label: 'Áo Dài Lụa Tơ Tằm' },
  { id: 'brocade', label: 'Áo Dài Gấm Luxury' },
  { id: 'embroidered', label: 'Áo Dài Thêu Tay' },
];

export const categoryKeys: Record<string, string> = {
  'Áo dài Cưới': 'wedding',
  'Áo dài Cách tân': 'modern',
  'Áo dài Lễ/Tết': 'festival',
  'Áo dài Trẻ em': 'kids',
  'Phụ kiện': 'accessories',
};

export const colorKeys: Record<string, string> = {
  'Đỏ': 'red',
  'Vàng': 'yellow',
  'Hồng': 'pink',
  'Trắng': 'white',
  'Lụa trơn': 'plainSilk',
  'Gấm thêu': 'embroideredBrocade',
};

export const materialKeys: Record<string, string> = {
  'Lụa Tơ Tằm': 'silk',
  'Gấm': 'brocade',
  'Tơ Nhung': 'velvet',
  'Voan': 'chiffon',
};

/** Tra ngược khóa URL (red, silk…) → giá trị gốc ('Đỏ', 'Lụa Tơ Tằm'…) */
export const fromKey = (keys: Record<string, string>, key?: string) =>
  key ? Object.keys(keys).find((name) => keys[name] === key) : undefined;

/** Sản phẩm có thuộc bộ sưu tập `colId` hay không (bộ sưu tập là nhóm ảo trên danh mục / chất liệu / tên) */
export const matchCollection = (product: MockProduct, colId: string) => {
  if (colId === 'wedding') return product.category === 'Áo dài Cưới';
  if (colId === 'modern') return product.category === 'Áo dài Cách tân';
  if (colId === 'silk') return product.material === 'Lụa Tơ Tằm';
  if (colId === 'brocade') return product.material === 'Gấm';
  if (colId === 'embroidered') {
    return (
      product.name.vi.toLowerCase().includes('thêu') ||
      product.description.vi.toLowerCase().includes('thêu')
    );
  }
  return false;
};
