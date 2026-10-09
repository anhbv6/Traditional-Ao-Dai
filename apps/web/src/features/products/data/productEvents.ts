/**
 * Sự kiện / ưu đãi hiển thị ở banner đầu trang Cửa hàng (mock — thay bằng CMS khi có API).
 * Chữ hiển thị nằm trong `messages/<locale>/products.json` tại `events.items.<id>`.
 */
export interface ProductEvent {
  id: 'wedding' | 'tet' | 'silk';
  image: string;
  /** Vị trí lấy nét của ảnh dọc khi cắt vào khung banner */
  imagePosition: string;
  /** Màu nền khối chữ — mỗi sự kiện một tông, đều đủ tương phản với chữ trắng */
  panelColor: string;
  /** Mã bộ sưu tập dùng cho `?category=` (khớp `collectionOptions` của bộ lọc) */
  collection: string;
  /** Thời điểm kết thúc ưu đãi (ISO, giờ Việt Nam) */
  endsAt: string;
}

export const productEvents: ProductEvent[] = [
  {
    id: 'wedding',
    image: '/login_banner.jpg',
    imagePosition: '50% 25%',
    panelColor: '#2A0A12',
    collection: 'wedding',
    endsAt: '2026-12-31T23:59:59+07:00',
  },
  {
    id: 'tet',
    image: '/images/login1.jpg',
    imagePosition: '50% 30%',
    panelColor: '#5C1420',
    collection: 'brocade',
    endsAt: '2027-02-05T23:59:59+07:00',
  },
  {
    id: 'silk',
    image: '/images/login2.jpg',
    imagePosition: '50% 30%',
    panelColor: '#33402F',
    collection: 'silk',
    endsAt: '2026-11-30T23:59:59+07:00',
  },
];

/** Thời gian mỗi slide tự chuyển (giây) — dùng chung cho thanh tiến trình */
export const EVENT_SLIDE_SECONDS = 7;
