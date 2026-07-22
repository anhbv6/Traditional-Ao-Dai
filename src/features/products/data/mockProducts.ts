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
  imageAlt: string;
}

export const mockProducts: MockProduct[] = [
  {
    id: '1',
    name: {
      vi: 'Áo Dài Gấm Song Hỷ',
      en: 'Song Hy Brocade Ao Dai',
    },
    description: {
      vi: 'Sắc đỏ truyền thống kết hợp hoa văn hỷ sự thêu nổi tinh tế, phom dáng ôm khít tôn dáng.',
      en: 'Traditional red color combined with sophisticated embossed wedding patterns.',
    },
    price: {
      vi: '1.890.000 ₫',
      en: '$89.00',
    },
    originalPrice: {
      vi: '2.200.000 ₫',
      en: '$110.00',
    },
    imageSrc: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Song Hy Brocade Ao Dai',
  },
  {
    id: '2',
    name: {
      vi: 'Áo Dài Tơ Tằm Cổ Điển',
      en: 'Classic Mulberry Silk Ao Dai',
    },
    description: {
      vi: 'Làm từ lụa tơ tằm thượng hạng, dáng suông truyền thống mềm mại, bay bổng.',
      en: 'Made from premium mulberry silk, soft and graceful traditional loose fit.',
    },
    price: {
      vi: '2.450.000 ₫',
      en: '$115.00',
    },
    originalPrice: {
      vi: '2.900.000 ₫',
      en: '$135.00',
    },
    imageSrc: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Classic Mulberry Silk Ao Dai',
  },
  {
    id: '3',
    name: {
      vi: 'Áo Dài Cách Tân Hoa Đào',
      en: 'Modern Peach Blossom Ao Dai',
    },
    description: {
      vi: 'Phong cách trẻ trung với tay lỡ phối voan hoa nhẹ nhàng, nữ tính và năng động.',
      en: 'Youthful style with half-sleeves blended with gentle, feminine chiffon flowers.',
    },
    price: {
      vi: '1.290.000 ₫',
      en: '$59.00',
    },
    originalPrice: {
      vi: '1.500.000 ₫',
      en: '$70.00',
    },
    imageSrc: 'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Modern Peach Blossom Ao Dai',
  },
  {
    id: '4',
    name: {
      vi: 'Áo Dài Nhung Mỹ Duyên',
      en: 'My Duyen Luxury Velvet Ao Dai',
    },
    description: {
      vi: 'Chất nhung cao cấp mềm mịn đính hạt cườm ngọc trai thủ công phần cổ sang trọng.',
      en: 'Premium velvet material with hand-stitched pearl bead detailing at the collar.',
    },
    price: {
      vi: '2.150.000 ₫',
      en: '$99.00',
    },
    originalPrice: {
      vi: '2.600.000 ₫',
      en: '$120.00',
    },
    imageSrc: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'My Duyen Luxury Velvet Ao Dai',
  },
  {
    id: '5',
    name: {
      vi: 'Áo Dài Nhật Bình Cách Điệu',
      en: 'Stylized Nhat Binh Dress',
    },
    description: {
      vi: 'Lấy cảm hứng từ trang phục triều đình Huế cổ xưa phối màu đương đại tinh tế.',
      en: 'Inspired by ancient Hue imperial court attire with modern, elegant color palettes.',
    },
    price: {
      vi: '3.200.000 ₫',
      en: '$149.00',
    },
    originalPrice: {
      vi: '3.800.000 ₫',
      en: '$180.00',
    },
    imageSrc: 'https://images.unsplash.com/photo-1549064482-6779ba3292fe?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Stylized Nhat Binh Dress',
  },
  {
    id: '6',
    name: {
      vi: 'Áo Dài Lụa Hà Đông Trắng',
      en: 'White Ha Dong Silk Ao Dai',
    },
    description: {
      vi: 'Nét tinh khôi thanh tao của lụa Hà Đông dệt vân chìm, dáng thướt tha nữ sinh.',
      en: 'Pure elegance of white Ha Dong silk with subtle woven textures, student style.',
    },
    price: {
      vi: '1.450.000 ₫',
      en: '$68.00',
    },
    imageSrc: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'White Ha Dong Silk Ao Dai',
  },
  {
    id: '7',
    name: {
      vi: 'Áo Dài Hoàng Cung Gấm Vàng',
      en: 'Royal Golden Brocade Ao Dai',
    },
    description: {
      vi: 'Gấm dệt chỉ vàng sang trọng với hoa văn phượng hoàng thích hợp cho đại lễ.',
      en: 'Luxurious gold-threaded brocade with phoenix patterns suitable for grand events.',
    },
    price: {
      vi: '2.800.000 ₫',
      en: '$129.00',
    },
    originalPrice: {
      vi: '3.300.000 ₫',
      en: '$155.00',
    },
    imageSrc: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Royal Golden Brocade Ao Dai',
  },
  {
    id: '8',
    name: {
      vi: 'Áo Dài Phượng Cát Cánh',
      en: 'Phuong Cat Blue Silk Ao Dai',
    },
    description: {
      vi: 'Tông màu xanh ngọc bích sang trọng thêu chim phượng cát tường tinh xảo.',
      en: 'Sophisticated jade blue silk embroidered with auspicious phoenix cranes.',
    },
    price: {
      vi: '1.980.000 ₫',
      en: '$92.00',
    },
    originalPrice: {
      vi: '2.400.000 ₫',
      en: '$110.00',
    },
    imageSrc: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Phuong Cat Blue Silk Ao Dai',
  },
];
