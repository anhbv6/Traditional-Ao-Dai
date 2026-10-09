/**
 * Thông tin liên hệ cố định của showroom (chưa có API cấu hình cửa hàng).
 * Chuỗi hiển thị nằm trong `messages/<locale>/contact.json`; ở đây chỉ giữ giá trị dùng cho liên kết.
 */
export const CONTACT_CHANNELS = {
  phoneHref: "tel:0909000000",
  zaloHref: "https://zalo.me/0909000000",
  emailHref: "mailto:hello@aodai.vn",
} as const;

/** Truy vấn bản đồ — phải khớp với địa chỉ hiển thị (`visit.address`) */
const MAP_QUERY = "Quận 1, TP. Hồ Chí Minh, Việt Nam";

export const CONTACT_MAP = {
  embedSrc: `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`,
  directionsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`,
} as const;
