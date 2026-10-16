/**
 * Các "giai đoạn" (khối) của trang chủ theo đúng thứ tự hiển thị — dùng cho thanh tiến trình HomeStageNav.
 * Thêm / bớt / đổi thứ tự khối ở page.tsx thì cập nhật mảng này cho khớp.
 * Mốc đầu là banner (không đánh số); các mốc sau đánh số 01, 02… khớp số thứ tự trên tiêu đề từng khối.
 * Tên hiển thị: messages HomePage.stages.<id>.
 */
export const HOME_STAGES = [
  'hero',
  'collections',
  'bestSellers',
  'craft',
  'bespoke',
  'reviews',
  'news',
] as const;

export type HomeStageId = (typeof HOME_STAGES)[number];

/** id phần tử DOM của một khối — dùng chung giữa HomeStage (đánh dấu) và HomeStageNav (đọc vị trí / cuộn tới) */
export const homeStageElementId = (id: HomeStageId) => `home-${id}`;
