/**
 * Số liệu tương tác mẫu của bài viết (mock — thay bằng API khi có module bình luận / đánh giá bài viết).
 * Số liệu suy ra cố định từ `id` bài để mỗi bài khác nhau nhưng server và client luôn khớp (không lệch hydration).
 */

/** Phản hồi 1 cấp dưới một bình luận (không có phản hồi con) */
export interface NewsCommentReply {
  id: string;
  name: string;
  /** Phản hồi từ tác giả / cửa hàng — hiện nhãn riêng */
  isAuthor?: boolean;
  /** Ngày giờ (ISO) */
  date: string;
  content: { vi: string; en: string };
}

export interface NewsComment {
  id: string;
  name: string;
  avatar?: string | null;
  date: string;
  content: { vi: string; en: string };
  likes: number;
  replies?: NewsCommentReply[];
}

export interface ArticleEngagementSeed {
  likes: number;
  dislikes: number;
  /** Tổng điểm sao và số lượt chấm (điểm TB = ratingSum / ratingCount) */
  ratingSum: number;
  ratingCount: number;
  comments: NewsComment[];
}

const COMMENT_POOL: Omit<NewsComment, "id" | "date">[] = [
  {
    name: "Ngọc Anh",
    avatar: "/images/ex3.jpg",
    content: {
      vi: "Bài viết rất chi tiết và dễ hiểu. Mình đã áp dụng cách phơi trong bóng râm, áo lụa giữ màu tốt hơn hẳn.",
      en: "Very detailed and easy to follow. I started drying my silk ao dai in the shade and the colour holds much better.",
    },
    likes: 24,
    replies: [
      {
        id: "author",
        name: "Traditional Ao Dai",
        isAuthor: true,
        date: "",
        content: {
          vi: "Cảm ơn chị đã chia sẻ! Chúc chị luôn giữ được tà áo đẹp như mới.",
          en: "Thank you for sharing! May your ao dai always stay as beautiful as new.",
        },
      },
    ],
  },
  {
    name: "Minh Thư",
    avatar: "/images/ex5.jpg",
    content: {
      vi: "Có thể làm thêm bài về cách chọn chất liệu cho mùa hè không ạ? Mình hay bị nóng khi mặc gấm.",
      en: "Could you write about choosing fabrics for summer? Brocade always feels too warm for me.",
    },
    likes: 11,
  },
  {
    name: "Hoàng Lan",
    avatar: null,
    content: {
      vi: "Thông tin hữu ích, mình sẽ gửi cho mẹ đọc. Mong shop ra thêm nhiều cẩm nang như thế này.",
      en: "Useful information, I'll share it with my mum. Hope to see more guides like this.",
    },
    likes: 7,
  },
  {
    name: "Thu Trang",
    avatar: "/images/ex8.jpg",
    content: {
      vi: "Ảnh minh họa đẹp quá. Phần mẹo bảo quản bằng túi vải mình chưa biết, cảm ơn tác giả.",
      en: "Lovely photos. I didn't know the cotton-bag storage tip — thank you!",
    },
    likes: 15,
  },
  {
    name: "Quốc Bảo",
    avatar: null,
    content: {
      vi: "Mình mua áo dài tặng vợ, đọc bài này mới biết cần chú ý nhiều thứ như vậy. Rất đáng đọc.",
      en: "I bought an ao dai for my wife and only now realise how much care it needs. Well worth reading.",
    },
    likes: 5,
  },
];

const COMMENTS_PER_ARTICLE = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Mốc cố định để ngày bình luận mẫu không đổi giữa server và client */
const SEED_BASE_TIME = Date.UTC(2026, 9, 15, 9, 30);

export function getArticleEngagementSeed(articleId: string): ArticleEngagementSeed {
  const n = Number.parseInt(articleId, 10) || 1;
  const ratingCount = 18 + ((n * 7) % 40);

  const comments = Array.from({ length: COMMENTS_PER_ARTICLE }, (_, index) => {
    const base = COMMENT_POOL[(n + index) % COMMENT_POOL.length];
    const date = new Date(SEED_BASE_TIME - (index * 2 + (n % 3)) * DAY_MS).toISOString();
    return {
      ...base,
      id: `seed-${articleId}-${index}`,
      date,
      replies: base.replies?.map((reply) => ({
        ...reply,
        id: `seed-${articleId}-${index}-${reply.id}`,
        date: new Date(Date.parse(date) + DAY_MS / 4).toISOString(),
      })),
    };
  });

  return {
    likes: 40 + ((n * 13) % 90),
    dislikes: 1 + (n % 5),
    // Điểm TB dao động ~4.5–4.9
    ratingSum: Math.round(ratingCount * (4.5 + (n % 5) * 0.1)),
    ratingCount,
    comments,
  };
}
