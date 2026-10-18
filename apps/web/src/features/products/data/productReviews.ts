/**
 * Đánh giá mẫu cho tab "Đánh giá" ở trang chi tiết (mock — thay bằng API khi có module reviews).
 * Đủ đa dạng số sao / có ảnh / lượt thích / phản hồi để bộ lọc, sắp xếp và phần tương tác có ý nghĩa.
 */

/** Phản hồi 1 cấp dưới một đánh giá (phản hồi không có phản hồi con) */
export interface ReviewReply {
  id: string;
  name: string;
  /** Phản hồi từ cửa hàng — hiện nhãn riêng */
  isShop?: boolean;
  date: string;
  content: { vi: string; en: string };
}

export interface ProductReview {
  id: string;
  name: string;
  avatar: string;
  /** Ngày đánh giá (ISO) — định dạng hiển thị theo ngôn ngữ ở giao diện */
  date: string;
  score: number;
  title: { vi: string; en: string };
  content: { vi: string; en: string };
  /** Ảnh khách đính kèm */
  media?: string[];
  /** Số lượt thấy hữu ích / không hữu ích */
  likes: number;
  dislikes: number;
  replies?: ReviewReply[];
}

export const productReviews: ProductReview[] = [
  {
    id: 'r1',
    name: 'Mark Williams',
    avatar: '/images/ex10.jpg',
    date: '2026-06-05',
    score: 5,
    title: { vi: 'Sản phẩm rất đẹp, tôi rất thích', en: 'Beautiful piece, I love it' },
    content: {
      vi: 'Chất vải mềm, màu sắc sang và đường may rất chỉn chu. Form áo lên dáng đẹp, phù hợp cho những dịp trang trọng.',
      en: 'The fabric is soft, the colour feels refined and the stitching is meticulous. The silhouette is flattering and perfect for formal occasions.',
    },
    media: ['/images/ex1.jpg', '/images/ex5.jpg'],
    likes: 24,
    dislikes: 1,
    replies: [
      {
        id: 'r1-1',
        name: 'AODAI',
        isShop: true,
        date: '2026-06-06',
        content: {
          vi: 'Cảm ơn anh Mark đã tin chọn AODAI! Chúc anh và gia đình có những dịp thật đẹp cùng chiếc áo.',
          en: 'Thank you for choosing AODAI, Mark! We wish you and your family many beautiful occasions in it.',
        },
      },
    ],
  },
  {
    id: 'r2',
    name: 'Alexa Johnson',
    avatar: '/images/ex8.jpg',
    date: '2026-06-02',
    score: 5,
    title: { vi: 'Con gái tôi rất hài lòng với sản phẩm này', en: 'My daughter is very happy with it' },
    content: {
      vi: 'Mẫu áo ngoài đời đẹp hơn ảnh, mặc nhẹ và thoải mái. Gia đình tôi rất hài lòng với phần tư vấn chọn size.',
      en: 'It looks even better in person, light and comfortable to wear. Our family was very pleased with the sizing advice.',
    },
    likes: 12,
    dislikes: 0,
  },
  {
    id: 'r3',
    name: 'Nguyễn Thu Hà',
    avatar: '/images/ex2.jpg',
    date: '2026-05-28',
    score: 4,
    title: { vi: 'Đẹp, giao hơi chậm', en: 'Lovely, delivery a bit slow' },
    content: {
      vi: 'Áo đẹp, thêu tay tỉ mỉ. Trừ một sao vì giao muộn hơn hẹn hai ngày, nhưng shop có báo trước.',
      en: 'Beautiful dress with careful hand embroidery. One star off because it arrived two days late, though the shop let me know in advance.',
    },
    media: ['/images/ex7.jpg'],
    likes: 9,
    dislikes: 2,
    replies: [
      {
        id: 'r3-1',
        name: 'AODAI',
        isShop: true,
        date: '2026-05-29',
        content: {
          vi: 'Xin lỗi chị Hà vì giao trễ. Shop đã gửi kèm voucher giảm 10% cho đơn sau ạ.',
          en: 'Sorry for the late delivery, Ha. We have sent you a 10% voucher for your next order.',
        },
      },
      {
        id: 'r3-2',
        name: 'Phạm Ngọc Mai',
        date: '2026-05-30',
        content: {
          vi: 'Mình cũng đặt mẫu này, thêu đẹp thật sự!',
          en: 'I ordered this one too, the embroidery really is lovely!',
        },
      },
    ],
  },
  {
    id: 'r4',
    name: 'Trần Minh Anh',
    avatar: '/images/ex4.jpg',
    date: '2026-05-20',
    score: 5,
    title: { vi: 'May đo vừa như in', en: 'Tailored to a perfect fit' },
    content: {
      vi: 'Mình đặt may theo số đo, áo vừa khít, tà áo bay rất đẹp khi chụp ảnh cưới. Sẽ quay lại đặt thêm cho mẹ.',
      en: 'I ordered it made to measure and it fits perfectly; the panels flow beautifully in our wedding photos. I will order one for my mother too.',
    },
    media: ['/images/ex3.jpg', '/images/ex6.jpg', '/images/ex9.jpg'],
    likes: 31,
    dislikes: 0,
  },
  {
    id: 'r5',
    name: 'Lê Phương Linh',
    avatar: '/images/ex6.jpg',
    date: '2026-05-11',
    score: 3,
    title: { vi: 'Màu hơi khác ảnh', en: 'Colour slightly different from the photos' },
    content: {
      vi: 'Chất vải ổn nhưng màu ngoài đời đậm hơn ảnh một chút. Shop hỗ trợ đổi nhanh nên vẫn hài lòng.',
      en: 'The fabric is fine but the colour is a little deeper than in the photos. The shop exchanged it quickly, so I am still satisfied.',
    },
    likes: 5,
    dislikes: 3,
  },
  {
    id: 'r6',
    name: 'Emily Carter',
    avatar: '/images/ex9.jpg',
    date: '2026-04-30',
    score: 4,
    title: { vi: 'Đáng tiền', en: 'Worth the price' },
    content: {
      vi: 'Đường may chắc chắn, lụa mát. Size hơi rộng ở vai, nên tham khảo bảng size trước khi đặt.',
      en: 'Solid stitching and cool silk. Slightly roomy at the shoulders, so check the size chart before ordering.',
    },
    likes: 7,
    dislikes: 1,
  },
];
