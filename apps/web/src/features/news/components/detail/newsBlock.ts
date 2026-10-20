import { RoundedStar } from "@smastrom/react-rating";

/** Khung chung của mỗi khối trong trang chi tiết bài viết (đầu bài, thân bài, đánh giá, bình luận...) */
export const NEWS_BLOCK_CLASS = "border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-8";

/** Tiêu đề nhỏ của khối */
export const NEWS_BLOCK_TITLE_CLASS =
  "font-[family-name:var(--font-playfair)] text-lg font-semibold text-[var(--text-main)] sm:text-xl";

/** Màu sao dùng cho mọi chỗ hiển thị điểm bài viết */
export const newsRatingStyles = {
  itemShapes: RoundedStar,
  activeFillColor: "#C9962B",
  inactiveFillColor: "#EFE4D8",
};
