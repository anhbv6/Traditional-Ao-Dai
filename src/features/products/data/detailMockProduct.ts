export interface GalleryItem {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  alt?: string;
  thumbnail?: string;
}

export interface OptionValue {
  id: string;
  label: string;
  hex?: string;
  image?: string;
  description?: string;
  is_custom?: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  code: string;
  values: OptionValue[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  options_combination: {
    color: string;
    size: string;
    purchase_type: string;
  };
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  is_available: boolean;
  image: string;
}

export interface MeasurementField {
  field_key: string;
  label: string;
  required: boolean;
  placeholder: string;
}

export interface ProductTab {
  key: string;
  title: string;
  content_html?: string;
  image_url?: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
}

export interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnail: string;
}

export interface MockDetailProduct {
  code: number;
  message: string;
  data: {
    id: string;
    name: string;
    slug: string;
    sku_code: string;
    brand: string;
    short_description: string;
    rating: {
      average: number;
      total_reviews: number;
    };
    gallery: GalleryItem[];
    options: ProductOption[];
    variants: ProductVariant[];
    custom_measurement_fields: MeasurementField[];
    tabs: ProductTab[];
    add_ons: AddOn[];
    related_products: RelatedProduct[];
    seo: {
      title: string;
      description: string;
      og_image: string;
    };
  };
}

const colors1 = [
  { id: 'val_red', label: 'Đỏ Cẩm', hex: '#900C3F', image: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=900&auto=format&fit=crop' },
  { id: 'val_yellow', label: 'Vàng Cúc', hex: '#FFC300', image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=900&auto=format&fit=crop' },
  { id: 'val_green', label: 'Xanh Trúc', hex: '#0A5C36', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop' },
  { id: 'val_pink', label: 'Hồng Sen', hex: '#D95D80', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop' },
  { id: 'val_white', label: 'Trắng Ngà', hex: '#F7F0E8', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop' }
];

const colors2 = [
  { id: 'val_gold', label: 'Vàng Hoàng Kim', hex: '#D4AF37', image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=900&auto=format&fit=crop' },
  { id: 'val_red_velvet', label: 'Đỏ Nhung', hex: '#800020', image: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=900&auto=format&fit=crop' },
  { id: 'val_emerald', label: 'Xanh Ngọc', hex: '#097969', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop' },
  { id: 'val_pearl', label: 'Trắng Ngọc Trai', hex: '#EAE6DF', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop' }
];

const colors3 = [
  { id: 'val_wedding_red', label: 'Đỏ Song Hỷ', hex: '#C70039', image: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=900&auto=format&fit=crop' },
  { id: 'val_rose', label: 'Hồng Tường Vi', hex: '#E0115F', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop' },
  { id: 'val_pure_white', label: 'Trắng Tinh Khôi', hex: '#FFFFFF', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop' }
];

const sizes = [
  { id: 'val_s', label: 'S', description: '40 - 47kg' },
  { id: 'val_m', label: 'M', description: '48 - 53kg' },
  { id: 'val_l', label: 'L', description: '54 - 60kg' },
  { id: 'val_custom', label: 'May Đo Theo Số Đo', is_custom: true }
];

const purchaseTypes = [
  { id: 'val_only_ao', label: 'Chỉ mua Áo Dài' },
  { id: 'val_combo_quan', label: 'Bộ Áo + Quần Lụa' },
  { id: 'val_full_set', label: 'Full Set (Áo + Quần + Mấn đội đầu)' }
];

const customMeasurementFields = [
  { field_key: "height", label: "Chiều cao (cm)", required: true, placeholder: "VD: 160" },
  { field_key: "weight", label: "Cân nặng (kg)", required: true, placeholder: "VD: 48" },
  { field_key: "bust", label: "Vòng 1 (cm)", required: true, placeholder: "Đo qua đỉnh ngực" },
  { field_key: "waist", label: "Vòng 2 / Eo (cm)", required: true, placeholder: "Đo đoạn nhỏ nhất trên rốn" },
  { field_key: "hips", label: "Vòng 3 / Mông (cm)", required: true, placeholder: "Đo đỉnh mông" },
  { field_key: "ao_length", label: "Chiều dài áo mong muốn (cm)", required: false, placeholder: "Để trống nếu muốn độ dài chuẩn" }
];

// Generate complete matrix of variants for any set of colors, sizes, and purchase types
const generateVariants = (colorList: typeof colors1, basePriceVal: number, comparePriceVal: number): ProductVariant[] => {
  const list: ProductVariant[] = [];
  let index = 1;

  for (const c of colorList) {
    for (const s of sizes) {
      for (const p of purchaseTypes) {
        const isCustom = s.is_custom;
        
        let basePrice = basePriceVal;
        let comparePrice = comparePriceVal;

        // Custom size offset
        if (isCustom) {
          basePrice += 300000;
          comparePrice = 0; // No discount on custom
        }

        // Purchase type offset
        if (p.id === 'val_combo_quan') {
          basePrice += 200000;
          if (comparePrice > 0) comparePrice += 250000;
        } else if (p.id === 'val_full_set') {
          basePrice += 400000;
          if (comparePrice > 0) comparePrice += 450000;
        }

        list.push({
          id: `var_${index.toString().padStart(2, '0')}`,
          sku: `AD-${c.label.toUpperCase()}-${s.label.toUpperCase()}-${p.id.toUpperCase()}`,
          options_combination: {
            color: c.id,
            size: s.id,
            purchase_type: p.id
          },
          price: basePrice,
          compare_at_price: comparePrice > 0 ? comparePrice : null,
          stock_quantity: isCustom ? 999 : (index % 10) + 2,
          is_available: true,
          image: c.image
        });
        index++;
      }
    }
  }

  return list;
};

export const mockDetailProducts: Record<string, MockDetailProduct['data']> = {
  "ao-dai-cach-tan-lua-ha-dong-det-hoa-cuc": {
    id: "prod_aodai_2026_01",
    name: "Áo Dài Cách Tân Lụa Hà Đông Dệt Hoa Cúc",
    slug: "ao-dai-cach-tan-lua-ha-dong-det-hoa-cuc",
    sku_code: "AD-HT-2026",
    brand: "Áo Dài Việt",
    short_description: "Thiết kế cách tân kết hợp lụa tơ tằm dệt chìm họa tiết hoa cúc truyền thống, mang lại vẻ đẹp thanh lịch, hiện đại.",
    rating: {
      average: 4.9,
      total_reviews: 128
    },
    gallery: [
      {
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=900&auto=format&fit=crop",
        alt: "Áo Dài Lụa Hà Đông - Mặt trước"
      },
      {
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop",
        alt: "Cận cảnh hoa văn thêu tay"
      },
      {
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=900&auto=format&fit=crop",
        alt: "Áo Dài Lụa Hà Đông - Phối cảnh nghiêng"
      }
    ],
    options: [
      { id: "opt_color", name: "Màu sắc", code: "color", values: colors1 },
      { id: "opt_size", name: "Kích thước", code: "size", values: sizes },
      { id: "opt_type", name: "Loại sản phẩm", code: "purchase_type", values: purchaseTypes }
    ],
    variants: generateVariants(colors1, 1250000, 1500000),
    custom_measurement_fields: customMeasurementFields,
    tabs: [
      {
        key: "details",
        title: "Chi tiết sản phẩm",
        content_html: "<p><b>Chất liệu:</b> Lụa Tơ Tằm Bảo Lộc cao cấp, co giãn nhẹ, thấm hút mồ hôi tốt.</p><p><b>Kiểu dáng:</b> Dáng áo cổ 2cm, tay lỡ, tà rộng 55cm chuẩn phom truyền thống.</p>"
      },
      {
        key: "size_guide",
        title: "Bảng quy chuẩn số đo",
        image_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=900&auto=format&fit=crop"
      },
      {
        key: "care_instructions",
        title: "Hướng dẫn bảo quản",
        content_html: "<ul><li>Giặt tay bằng nước lạnh hoặc giặt hấp khô.</li><li>Không xịt trực tiếp nước hoa lên vải lụa.</li><li>Ủi/Là ở nhiệt độ nhẹ (Chế độ Silk).</li></ul>"
      }
    ],
    add_ons: [
      {
        id: "addon_man_01",
        name: "Mấn Đội Đầu Lụa Xoắn Thủ Công",
        price: 150000,
        thumbnail: "https://images.unsplash.com/photo-1549064482-6779ba3292fe?q=80&w=900&auto=format&fit=crop"
      }
    ],
    related_products: [
      {
        id: "prod_102",
        name: "Áo Dài Cách Tân Gấm Thêu Tay",
        slug: "ao-dai-cach-tan-gam-theu-tay",
        price: 1450000,
        thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop"
      },
      {
        id: "prod_103",
        name: "Áo Dài Truyền Thống Hoa Sen Nổi",
        slug: "ao-dai-truyen-thong-hoa-sen-noi",
        price: 1750000,
        thumbnail: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=900&auto=format&fit=crop"
      }
    ],
    seo: {
      title: "Áo Dài Cách Tân Lụa Hà Đông Dệt Hoa Cúc - Cao Cấp 2026",
      description: "Mua Áo Dài Cách Tân Lụa Hà Đông chính hãng, có nhận may đo theo số đo riêng...",
      og_image: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=900&auto=format&fit=crop"
    }
  },

  "ao-dai-gam-luxury-hoang-gia": {
    id: "prod_aodai_2026_02",
    name: "Áo Dài Gấm Luxury Hoàng Gia",
    slug: "ao-dai-gam-luxury-hoang-gia",
    sku_code: "AD-GL-2026",
    brand: "Áo Dài Việt",
    short_description: "Thiết kế gấm dày dặn kết hợp dệt chỉ vàng tinh tế, mang lại vẻ đẹp quý phái, kiêu sa chuẩn cung đình.",
    rating: {
      average: 4.8,
      total_reviews: 95
    },
    gallery: [
      {
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=900&auto=format&fit=crop",
        alt: "Áo Dài Gấm Luxury Hoàng Gia - Mặt trước"
      },
      {
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=900&auto=format&fit=crop",
        alt: "Cận cảnh hoa văn gấm thêu"
      }
    ],
    options: [
      { id: "opt_color", name: "Màu sắc", code: "color", values: colors2 },
      { id: "opt_size", name: "Kích thước", code: "size", values: sizes },
      { id: "opt_type", name: "Loại sản phẩm", code: "purchase_type", values: purchaseTypes }
    ],
    variants: generateVariants(colors2, 1850000, 2200000),
    custom_measurement_fields: customMeasurementFields,
    tabs: [
      {
        key: "details",
        title: "Chi tiết sản phẩm",
        content_html: "<p><b>Chất liệu:</b> Gấm Thượng Hải cao cấp dệt sợi kim tuyến vàng, đứng phom dáng sang trọng.</p><p><b>Kiểu dáng:</b> Thiết kế tà dài 120cm, cổ cao 3cm truyền thống tôn dáng.</p>"
      },
      {
        key: "care_instructions",
        title: "Hướng dẫn bảo quản",
        content_html: "<ul><li>Khuyến khích giặt khô hấp để giữ phom gấm.</li><li>Ủi hơi nước ở nhiệt độ vừa.</li></ul>"
      }
    ],
    add_ons: [
      {
        id: "addon_man_02",
        name: "Mấn Gấm Dệt Kim Tuyến Vàng",
        price: 180000,
        thumbnail: "https://images.unsplash.com/photo-1549064482-6779ba3292fe?q=80&w=900&auto=format&fit=crop"
      }
    ],
    related_products: [
      {
        id: "prod_101",
        name: "Áo Dài Cách Tân Lụa Hà Đông",
        slug: "ao-dai-cach-tan-lua-ha-dong-det-hoa-cuc",
        price: 1250000,
        thumbnail: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=900&auto=format&fit=crop"
      }
    ],
    seo: {
      title: "Áo Dài Gấm Luxury Hoàng Gia - Đẳng cấp Quý Phái",
      description: "Đặt mua Áo Dài Gấm Luxury Hoàng Gia cao cấp, tôn dáng cực chuẩn cho các dịp lễ trọng đại.",
      og_image: "https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=900&auto=format&fit=crop"
    }
  },

  "ao-dai-cuoi-theu-phuong-hoang-do": {
    id: "prod_aodai_2026_03",
    name: "Áo Dài Cưới Thêu Phượng Hoàng Đỏ",
    slug: "ao-dai-cuoi-theu-phuong-hoang-do",
    sku_code: "AD-CW-2026",
    brand: "Áo Dài Việt",
    short_description: "Kiệt tác áo dài cưới thêu tay hình phượng hoàng bay lượn tinh xảo, chất liệu lụa satin thượng hạng giúp cô dâu tỏa sáng rực rỡ.",
    rating: {
      average: 5.0,
      total_reviews: 180
    },
    gallery: [
      {
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop",
        alt: "Áo Dài Cưới Thêu Phượng Hoàng Đỏ - Mặt trước"
      },
      {
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop",
        alt: "Áo Dài Cưới Thêu Phượng Hoàng Đỏ - Thumbnail"
      }
    ],
    options: [
      { id: "opt_color", name: "Màu sắc", code: "color", values: colors3 },
      { id: "opt_size", name: "Kích thước", code: "size", values: sizes },
      { id: "opt_type", name: "Loại sản phẩm", code: "purchase_type", values: purchaseTypes }
    ],
    variants: generateVariants(colors3, 3500000, 4200000),
    custom_measurement_fields: customMeasurementFields,
    tabs: [
      {
        key: "details",
        title: "Chi tiết sản phẩm",
        content_html: "<p><b>Chất liệu:</b> Lụa Satin cao cấp thêu tay 100% bằng chỉ tơ tằm nguyên chất.</p><p><b>Họa tiết:</b> Hình phượng hoàng cổ điển kết hợp đính đá Swarovski thủ công lấp lánh.</p>"
      },
      {
        key: "care_instructions",
        title: "Hướng dẫn bảo quản",
        content_html: "<ul><li>Giặt khô hấp nhẹ nhàng tại các tiệm giặt ủi chuyên nghiệp.</li><li>Tránh tiếp xúc vật sắc nhọn gây xước chỉ thêu.</li></ul>"
      }
    ],
    add_ons: [
      {
        id: "addon_man_03",
        name: "Mấn Cô Dâu Thêu Hoa Phượng",
        price: 250000,
        thumbnail: "https://images.unsplash.com/photo-1549064482-6779ba3292fe?q=80&w=900&auto=format&fit=crop"
      }
    ],
    related_products: [
      {
        id: "prod_101",
        name: "Áo Dài Cách Tân Lụa Hà Đông",
        slug: "ao-dai-cach-tan-lua-ha-dong-det-hoa-cuc",
        price: 1250000,
        thumbnail: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=900&auto=format&fit=crop"
      }
    ],
    seo: {
      title: "Áo Dài Cưới Thêu Phượng Hoàng Đỏ - Đỉnh Cao Thiết Kế Cưới",
      description: "Áo Dài Cưới thêu phượng hoàng tay đỏ sang trọng, kiêu sa cho cô dâu ngày cưới hỏi truyền thống.",
      og_image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop"
    }
  }
};
