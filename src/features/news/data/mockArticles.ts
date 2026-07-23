export interface MockArticle {
  id: string;
  slug: string;
  category: {
    vi: string;
    en: string;
  };
  title: {
    vi: string;
    en: string;
  };
  description: {
    vi: string;
    en: string;
  };
  dateShort: {
    vi: string;
    en: string;
  };
  dateLong: {
    vi: string;
    en: string;
  };
  imageSrc: string;
  readTime: {
    vi: string;
    en: string;
  };
}

export const mockArticles: MockArticle[] = [
  {
    id: '1',
    slug: 'cach-giat-bao-quan-ao-dai',
    category: {
      vi: 'Cẩm Nang',
      en: 'Guide',
    },
    title: {
      vi: 'Cẩm nang giặt và bảo quản áo dài đúng cách từ chuyên gia',
      en: 'Expert Guide to Washing and Preserving Your Ao Dai',
    },
    description: {
      vi: 'Tìm hiểu các phương pháp giặt tay, giặt hấp và mẹo bảo quản lụa tơ tằm, gấm để tà áo dài của bạn luôn giữ được màu sắc rực rỡ và phom dáng như mới.',
      en: 'Learn handwashing, dry cleaning methods and storage tips for silk and brocade to keep your Ao Dai vibrant and in perfect shape.',
    },
    dateShort: {
      vi: '18/07/2026',
      en: '18/07/2026',
    },
    dateLong: {
      vi: '18 Tháng 7, 2026',
      en: 'July 18, 2026',
    },
    imageSrc: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?q=80&w=800&auto=format&fit=crop',
    readTime: {
      vi: '5 phút đọc',
      en: '5 min read',
    },
  },
  {
    id: '2',
    slug: 'bi-quyet-chon-ao-dai-cuoi-co-dau',
    category: {
      vi: 'Kinh Nghiệm',
      en: 'Tips',
    },
    title: {
      vi: 'Bí quyết chọn áo dài cưới tôn dáng nhất cho cô dâu trong ngày trọng đại',
      en: 'Choosing the Perfect Wedding Ao Dai to Flatters Your Figure',
    },
    description: {
      vi: 'Từ chất liệu gấm thêu tay truyền thống đến phom dáng cách tân đính cườm lộng lẫy, hãy chọn cho mình một tà áo dài cưới hoàn hảo để tỏa sáng.',
      en: 'From hand-embroidered traditional brocade to stunning beaded modern silhouettes, select the perfect wedding Ao Dai to shine on your big day.',
    },
    dateShort: {
      vi: '15/07/2026',
      en: '15/07/2026',
    },
    dateLong: {
      vi: '15 Tháng 7, 2026',
      en: 'July 15, 2026',
    },
    imageSrc: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=800&auto=format&fit=crop',
    readTime: {
      vi: '6 phút đọc',
      en: '6 min read',
    },
  },
  {
    id: '3',
    slug: 'lich-su-phat-trien-ao-dai-cach-tan',
    category: {
      vi: 'Văn Hóa',
      en: 'Culture',
    },
    title: {
      vi: 'Lịch sử và sự phát triển của áo dài cách tân qua các thế hệ',
      en: 'The Evolution of Modern Ao Dai Through Generations',
    },
    description: {
      vi: 'Hành trình sáng tạo từ tà áo dài truyền thống đến những nét chấm phá hiện đại, trẻ trung phù hợp với nhịp sống đương đại của phái đẹp.',
      en: 'The creative journey from traditional silhouettes to modern, youthful touches suited for the contemporary lifestyle of Vietnamese women.',
    },
    dateShort: {
      vi: '10/07/2026',
      en: '10/07/2026',
    },
    dateLong: {
      vi: '10 Tháng 7, 2026',
      en: 'July 10, 2026',
    },
    imageSrc: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    readTime: {
      vi: '8 phút đọc',
      en: '8 min read',
    },
  },
  {
    id: '4',
    slug: 'xu-huong-ao-dai-gam-tet-2026',
    category: {
      vi: 'Xu Hướng',
      en: 'Trends',
    },
    title: {
      vi: 'Xu hướng áo dài gấm Luxury cho mùa lễ hội và Tết 2026',
      en: 'Luxury Brocade Ao Dai Trends for Tet and Festive Season 2026',
    },
    description: {
      vi: 'Khám phá những mẫu áo dài gấm dệt hoa văn chìm sang trọng, phối cùng phụ kiện ngọc trai quý phái dẫn đầu xu hướng thời trang Việt năm nay.',
      en: 'Discover luxurious woven pattern brocade Ao Dai paired with elegant pearl accessories leading this year\'s Vietnamese fashion trends.',
    },
    dateShort: {
      vi: '05/07/2026',
      en: '05/07/2026',
    },
    dateLong: {
      vi: '05 Tháng 7, 2026',
      en: 'July 05, 2026',
    },
    imageSrc: 'https://images.unsplash.com/photo-1549064482-6779ba3292fe?q=80&w=800&auto=format&fit=crop',
    readTime: {
      vi: '4 phút đọc',
      en: '4 min read',
    },
  },
  {
    id: '5',
    slug: 'y-nghia-hoa-van-theu-tay-ao-dai',
    category: {
      vi: 'Văn Hóa',
      en: 'Culture',
    },
    title: {
      vi: 'Ý nghĩa sâu sắc của các hoa văn thêu tay truyền thống trên tà áo dài',
      en: 'The Deep Meaning of Traditional Hand-Embroidered Patterns on Ao Dai',
    },
    description: {
      vi: 'Từ nhành hoa sen thanh cao, đôi chim phượng cát tường đến họa tiết chim hạc bay bổng, mỗi đường thêu tay là một câu chuyện văn hóa đầy nghệ thuật.',
      en: 'From noble lotus blossoms and auspicious phoenixes to soaring cranes, every hand-stitch tells an artistic cultural story.',
    },
    dateShort: {
      vi: '01/07/2026',
      en: '01/07/2026',
    },
    dateLong: {
      vi: '01 Tháng 7, 2026',
      en: 'July 01, 2026',
    },
    imageSrc: 'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=800&auto=format&fit=crop',
    readTime: {
      vi: '7 phút đọc',
      en: '7 min read',
    },
  },
  {
    id: '6',
    slug: 'ao-dai-lua-to-tam-va-nhung-gia-tri-vuot-thoi-gian',
    category: {
      vi: 'Cẩm Nang',
      en: 'Guide',
    },
    title: {
      vi: 'Áo dài lụa tơ tằm: Sự kiêu sa và những giá trị vượt thời gian',
      en: 'Mulberry Silk Ao Dai: Elegance and Timeless Values',
    },
    description: {
      vi: 'Lụa tơ tằm tự nhiên luôn mang lại cảm giác mềm mại, thoáng mát và tôn lên vẻ quý phái cổ điển của người phụ nữ Việt qua nhiều thế kỷ.',
      en: 'Natural mulberry silk always brings a soft, breathable feel and enhances the classic noble look of Vietnamese women across centuries.',
    },
    dateShort: {
      vi: '28/06/2026',
      en: '28/06/2026',
    },
    dateLong: {
      vi: '28 Tháng 6, 2026',
      en: 'June 28, 2026',
    },
    imageSrc: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop',
    readTime: {
      vi: '5 phút đọc',
      en: '5 min read',
    },
  },
  {
    id: '7',
    slug: 'goi-y-phu-kien-phoi-cung-ao-dai',
    category: {
      vi: 'Kinh Nghiệm',
      en: 'Tips',
    },
    title: {
      vi: 'Gợi ý những phụ kiện hoàn hảo phối cùng áo dài truyền thống và cách tân',
      en: 'Perfect Accessories to Pair with Traditional and Modern Ao Dai',
    },
    description: {
      vi: 'Bí quyết chọn mấn thêu, vòng cổ ngọc trai, khuyên tai hay những chiếc túi xách thêu tay để hoàn thiện vẻ ngoài thanh lịch, cuốn hút nhất.',
      en: 'Tips for choosing embroidered headbands, pearl necklaces, earrings, or hand-embroidered bags to complete your most elegant and attractive look.',
    },
    dateShort: {
      vi: '25/06/2026',
      en: '25/06/2026',
    },
    dateLong: {
      vi: '25 Tháng 6, 2026',
      en: 'June 25, 2026',
    },
    imageSrc: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop',
    readTime: {
      vi: '6 phút đọc',
      en: '6 min read',
    },
  },
  {
    id: '8',
    slug: 'phom-dang-ao-dai-chuan-3d-va-dich-vu-may-do',
    category: {
      vi: 'May Đo',
      en: 'Tailoring',
    },
    title: {
      vi: 'Công nghệ cắt phom dáng 3D chuẩn xác và trải nghiệm may đo áo dài cá nhân',
      en: 'Precision 3D Tailoring and Personalized Ao Dai Fitting Experience',
    },
    description: {
      vi: 'Khám phá quy trình thiết kế và may đo thủ công tỉ mỉ để tạo nên những bộ áo dài vừa vặn tinh tế, tôn vinh đường cong tự nhiên của cơ thể.',
      en: 'Discover our meticulous design and bespoke tailoring process to create perfectly fitted Ao Dai that honor natural body curves.',
    },
    dateShort: {
      vi: '20/06/2026',
      en: '20/06/2026',
    },
    dateLong: {
      vi: '20 Tháng 6, 2026',
      en: 'June 20, 2026',
    },
    imageSrc: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    readTime: {
      vi: '5 phút đọc',
      en: '5 min read',
    },
  },
];
