/**
 * Dữ liệu trợ lý AI khu quản trị (mock) — thay bằng API mô hình AI + dữ liệu thật (đơn hàng, kho, xưởng) khi có backend.
 * Câu trả lời chọn theo từ khóa trong tin gửi; không khớp thì dùng câu mặc định.
 */
import { type AssistantReplyRule, type LocalizedText } from "../types/assistant.types";

/** Câu hỏi gợi ý bấm nhanh khi cuộc trò chuyện còn trống */
export const ASSISTANT_SUGGESTIONS: LocalizedText[] = [
  { vi: "Tóm tắt doanh thu hôm nay", en: "Summarise today's revenue" },
  { vi: "Sản phẩm nào sắp hết hàng?", en: "Which products are running low?" },
  { vi: "Xưởng đang may bao nhiêu đơn?", en: "How many orders are in the workshop?" },
  { vi: "Viết mô tả cho áo dài lụa", en: "Write a description for a silk ao dai" },
];

const RULES: AssistantReplyRule[] = [
  {
    keywords: ["doanh thu", "bán được", "revenue", "sales"],
    reply: {
      vi: 'Hôm nay cửa hàng có 8 đơn, doanh thu tạm tính 12.450.000 ₫ (tăng 18% so với hôm qua). Bán chạy nhất là "Áo dài cách tân Mùa Đông" với 3 đơn. Còn 2 đơn chờ xác nhận thanh toán.',
      en: 'Today the shop has 8 orders with estimated revenue of 12,450,000 ₫ (up 18% on yesterday). The best seller is the "Winter modern ao dai" with 3 orders. 2 orders are still awaiting payment confirmation.',
    },
  },
  {
    keywords: ["hết hàng", "tồn kho", "sắp hết", "kho", "stock", "running low", "inventory"],
    reply: {
      vi: 'Có 3 SKU dưới ngưỡng tồn kho: "test123 – size M" (còn 2), "Áo dài cưới đỏ – size S" (còn 1) và "Quần lụa trắng – size L" (còn 3). Bạn nên nhập thêm trước cuối tuần.',
      en: '3 SKUs are below the stock threshold: "test123 – size M" (2 left), "Red wedding ao dai – size S" (1 left) and "White silk trousers – size L" (3 left). Consider restocking before the weekend.',
    },
  },
  {
    keywords: ["xưởng", "may đo", "đang may", "workshop", "tailor"],
    reply: {
      vi: "Xưởng đang may 5 đơn: 2 đơn ở bước cắt vải, 2 đơn chờ thử áo và 1 đơn hoàn thiện. Đơn AD-2611 hẹn giao ngày mai nhưng chưa qua bước thử — nên nhắc thợ ưu tiên.",
      en: "The workshop has 5 orders in progress: 2 at cutting, 2 awaiting fitting and 1 being finished. Order AD-2611 is due tomorrow but hasn't been fitted yet — worth asking the tailor to prioritise it.",
    },
  },
  {
    keywords: ["mô tả", "viết", "description", "write"],
    reply: {
      vi: 'Gợi ý mô tả: "Tà áo lụa tơ tằm mềm rũ, khâu tay từng đường viền cổ. Sắc lụa ngả theo nắng, nhẹ như mây vùng cao — hợp cho buổi lễ trang trọng lẫn dạo phố ngày se lạnh." Bạn muốn giọng văn trang trọng hơn hay trẻ trung hơn?',
      en: 'Suggested copy: "Soft, flowing mulberry silk with a hand-stitched collar. The colour shifts with the light, airy as highland clouds — right for formal occasions and cool-weather strolls alike." Would you like it more formal or more playful?',
    },
  },
  {
    keywords: ["đơn mới", "đơn hàng", "chờ xử lý", "order"],
    reply: {
      vi: "Có 4 đơn mới chưa xử lý, đơn cũ nhất đặt từ 9 giờ sáng. 1 đơn có yêu cầu may đo kèm số đo đầy đủ, có thể chuyển thẳng sang xưởng.",
      en: "There are 4 new orders waiting, the oldest placed at 9 am. One is a bespoke order with complete measurements and can go straight to the workshop.",
    },
  },
  {
    keywords: ["bộ sưu tập", "collection"],
    reply: {
      vi: 'Bộ sưu tập "Mùa Đông Đoàn Viên" đang ở trạng thái Nháp với 2 sản phẩm. Để công bố "Sắp ra mắt", bạn cần thêm ảnh bìa mobile và ngày mở bán.',
      en: 'The "Mùa Đông Đoàn Viên" collection is a Draft with 2 products. To announce it as "Coming soon" you still need a mobile cover image and a launch date.',
    },
  },
];

const FALLBACK: LocalizedText = {
  vi: "Mình chưa có dữ liệu cho câu hỏi này (đang dùng dữ liệu mẫu). Bạn thử hỏi về doanh thu, tồn kho, xưởng may, đơn hàng hoặc nhờ viết mô tả sản phẩm nhé.",
  en: "I don't have data for that yet (this is sample data). Try asking about revenue, stock, the workshop, orders, or ask me to write a product description.",
};

/** Chọn câu trả lời mẫu theo từ khóa trong tin người dùng */
export function pickAssistantReply(message: string, locale: string): string {
  const text = message.toLowerCase();
  const rule = RULES.find((r) => r.keywords.some((keyword) => text.includes(keyword)));
  const reply = rule?.reply ?? FALLBACK;
  return locale === "en" ? reply.en : reply.vi;
}
