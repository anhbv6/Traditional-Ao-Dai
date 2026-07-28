import type { ProductColorSwatch } from '../components/ProductCard';

export interface MockProduct {
  id: string;
  name: {
    vi: string;
    en: string;
  };
  description: {
    vi: string;
    en: string;
  };
  price: {
    vi: string;
    en: string;
  };
  originalPrice?: {
    vi: string;
    en: string;
  };
  imageSrc: string;
  hoverImageSrc: string;
  imageAlt: string;
  badge?: string;
  category: string;
  purchaseType: 'ready' | 'custom';
  material: string;
  sizes: string[];
  colors: ProductColorSwatch[];
  numericPrice: number;
  popularity: number;
  liked: number;
}

const productImages = [
  'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1549064482-6779ba3292fe?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=900&auto=format&fit=crop',
];

const detailImages = [
  'https://images.unsplash.com/photo-1589363460779-cd717d2ed8fa?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=900&auto=format&fit=crop',
];

const colorSets: ProductColorSwatch[][] = [
  [
    { name: 'Đỏ đô', hex: '#800020', imageSrc: productImages[0] },
    { name: 'Hồng đất', hex: '#E2A79E', imageSrc: productImages[2] },
    { name: 'Vàng gấm', hex: '#D8A928', imageSrc: productImages[6] },
  ],
  [
    { name: 'Trắng ngà', hex: '#F7F0E8', imageSrc: productImages[5] },
    { name: 'Xanh ngọc', hex: '#4F8F8B', imageSrc: productImages[7] },
    { name: 'Lụa trơn', hex: '#C9B29B', imageSrc: productImages[1] },
  ],
  [
    { name: 'Hồng phấn', hex: '#F2B8C6', imageSrc: productImages[2] },
    { name: 'Đen nhung', hex: '#1E1B1D', imageSrc: productImages[3] },
    { name: 'Gấm thêu', hex: '#B77B3D', imageSrc: productImages[4] },
  ],
];

export const mockProducts: MockProduct[] = [
  {
    id: '1',
    name: { vi: 'Áo Dài Gấm Song Hỷ', en: 'Song Hy Brocade Ao Dai' },
    description: {
      vi: 'Sắc đỏ truyền thống kết hợp hoa văn hỷ sự thêu nổi tinh tế, phom dáng ôm khít tôn dáng.',
      en: 'Traditional red with refined wedding embroidery and a flattering tailored silhouette.',
    },
    price: { vi: '1.890.000 ₫', en: '$89.00' },
    originalPrice: { vi: '2.200.000 ₫', en: '$110.00' },
    imageSrc: productImages[0],
    hoverImageSrc: detailImages[0],
    imageAlt: 'Song Hy Brocade Ao Dai',
    badge: 'MỚI',
    category: 'Áo dài Cưới',
    purchaseType: 'ready',
    material: 'Gấm',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: colorSets[0],
    numericPrice: 1890000,
    popularity: 96,
    liked: 92,
  },
  {
    id: '2',
    name: { vi: 'Áo Dài Tơ Tằm Cổ Điển', en: 'Classic Mulberry Silk Ao Dai' },
    description: {
      vi: 'Làm từ lụa tơ tằm thượng hạng, dáng suông truyền thống mềm mại, bay bổng.',
      en: 'Premium mulberry silk with a graceful traditional drape.',
    },
    price: { vi: '2.450.000 ₫', en: '$115.00' },
    originalPrice: { vi: '2.900.000 ₫', en: '$135.00' },
    imageSrc: productImages[1],
    hoverImageSrc: detailImages[1],
    imageAlt: 'Classic Mulberry Silk Ao Dai',
    badge: 'BÁN CHẠY',
    category: 'Áo dài Lễ/Tết',
    purchaseType: 'custom',
    material: 'Lụa Tơ Tằm',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: colorSets[1],
    numericPrice: 2450000,
    popularity: 99,
    liked: 95,
  },
  {
    id: '3',
    name: { vi: 'Áo Dài Cách Tân Hoa Đào', en: 'Modern Peach Blossom Ao Dai' },
    description: {
      vi: 'Phong cách trẻ trung với tay lỡ phối voan hoa nhẹ nhàng, nữ tính và năng động.',
      en: 'A youthful modern cut with soft floral chiffon details.',
    },
    price: { vi: '1.290.000 ₫', en: '$59.00' },
    originalPrice: { vi: '1.500.000 ₫', en: '$70.00' },
    imageSrc: productImages[2],
    hoverImageSrc: detailImages[2],
    imageAlt: 'Modern Peach Blossom Ao Dai',
    badge: '-15%',
    category: 'Áo dài Cách tân',
    purchaseType: 'ready',
    material: 'Voan',
    sizes: ['S', 'M', 'L', 'Free-size'],
    colors: colorSets[2],
    numericPrice: 1290000,
    popularity: 82,
    liked: 88,
  },
  {
    id: '4',
    name: { vi: 'Áo Dài Nhung Mỹ Duyên', en: 'My Duyen Luxury Velvet Ao Dai' },
    description: {
      vi: 'Chất nhung cao cấp mềm mịn đính hạt cườm ngọc trai thủ công phần cổ sang trọng.',
      en: 'Premium velvet with hand-finished pearl beading at the collar.',
    },
    price: { vi: '2.150.000 ₫', en: '$99.00' },
    originalPrice: { vi: '2.600.000 ₫', en: '$120.00' },
    imageSrc: productImages[3],
    hoverImageSrc: detailImages[3],
    imageAlt: 'My Duyen Luxury Velvet Ao Dai',
    badge: 'CÓ SẴN SIZE',
    category: 'Áo dài Cưới',
    purchaseType: 'ready',
    material: 'Tơ Nhung',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: colorSets[2],
    numericPrice: 2150000,
    popularity: 91,
    liked: 90,
  },
  {
    id: '5',
    name: { vi: 'Áo Dài Nhật Bình Cách Điệu', en: 'Stylized Nhat Binh Dress' },
    description: {
      vi: 'Lấy cảm hứng từ trang phục triều đình Huế cổ xưa phối màu đương đại tinh tế.',
      en: 'Inspired by Hue imperial attire with a refined modern palette.',
    },
    price: { vi: '3.200.000 ₫', en: '$149.00' },
    originalPrice: { vi: '3.800.000 ₫', en: '$180.00' },
    imageSrc: productImages[4],
    hoverImageSrc: detailImages[0],
    imageAlt: 'Stylized Nhat Binh Dress',
    badge: 'MỚI',
    category: 'Áo dài Lễ/Tết',
    purchaseType: 'custom',
    material: 'Gấm',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: colorSets[0],
    numericPrice: 3200000,
    popularity: 86,
    liked: 94,
  },
  {
    id: '6',
    name: { vi: 'Áo Dài Lụa Hà Đông Trắng', en: 'White Ha Dong Silk Ao Dai' },
    description: {
      vi: 'Nét tinh khôi thanh tao của lụa Hà Đông dệt vân chìm, dáng thướt tha nữ sinh.',
      en: 'Pure white Ha Dong silk with subtle woven textures.',
    },
    price: { vi: '1.450.000 ₫', en: '$68.00' },
    imageSrc: productImages[5],
    hoverImageSrc: detailImages[1],
    imageAlt: 'White Ha Dong Silk Ao Dai',
    category: 'Áo dài Lễ/Tết',
    purchaseType: 'ready',
    material: 'Lụa Tơ Tằm',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: colorSets[1],
    numericPrice: 1450000,
    popularity: 79,
    liked: 85,
  },
  {
    id: '7',
    name: { vi: 'Áo Dài Hoàng Cung Gấm Vàng', en: 'Royal Golden Brocade Ao Dai' },
    description: {
      vi: 'Gấm dệt chỉ vàng sang trọng với hoa văn phượng hoàng thích hợp cho đại lễ.',
      en: 'Gold-threaded brocade with ceremonial phoenix patterning.',
    },
    price: { vi: '2.800.000 ₫', en: '$129.00' },
    originalPrice: { vi: '3.300.000 ₫', en: '$155.00' },
    imageSrc: productImages[6],
    hoverImageSrc: detailImages[2],
    imageAlt: 'Royal Golden Brocade Ao Dai',
    badge: 'BÁN CHẠY',
    category: 'Áo dài Cưới',
    purchaseType: 'custom',
    material: 'Gấm',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: colorSets[0],
    numericPrice: 2800000,
    popularity: 94,
    liked: 93,
  },
  {
    id: '8',
    name: { vi: 'Áo Dài Phượng Cát Xanh', en: 'Phuong Cat Blue Silk Ao Dai' },
    description: {
      vi: 'Tông màu xanh ngọc bích sang trọng thêu chim phượng cát tường tinh xảo.',
      en: 'Jade silk embroidered with auspicious phoenix details.',
    },
    price: { vi: '1.980.000 ₫', en: '$92.00' },
    originalPrice: { vi: '2.400.000 ₫', en: '$110.00' },
    imageSrc: productImages[7],
    hoverImageSrc: detailImages[3],
    imageAlt: 'Phuong Cat Blue Silk Ao Dai',
    category: 'Áo dài Cách tân',
    purchaseType: 'ready',
    material: 'Lụa Tơ Tằm',
    sizes: ['S', 'M', 'L', 'Free-size'],
    colors: colorSets[1],
    numericPrice: 1980000,
    popularity: 88,
    liked: 91,
  },
];

export const productCatalog: MockProduct[] = Array.from({ length: 9 }).flatMap((_, pageIndex) =>
  mockProducts.map((product, index) => ({
    ...product,
    id: `${pageIndex + 1}-${product.id}`,
    badge: pageIndex === 0 ? product.badge : index % 3 === 0 ? 'CÓ SẴN SIZE' : product.badge,
    numericPrice: product.numericPrice + pageIndex * 180000 + index * 35000,
    popularity: product.popularity - pageIndex * 4 + index,
    liked: product.liked - pageIndex * 3 + index,
  }))
);
