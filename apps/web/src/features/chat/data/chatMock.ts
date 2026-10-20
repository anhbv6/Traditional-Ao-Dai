/**
 * Dữ liệu chat mẫu (mock) — thay bằng API / WebSocket (chat với nhân viên) và API mô hình AI khi có backend.
 * Câu trả lời chọn theo từ khóa trong tin khách gửi; không khớp thì dùng câu mặc định của từng kênh.
 */
import { type ChatChannel, type ChatReplyRule, type LocalizedText } from "../types/chat.types";

/** Người đại diện mỗi kênh (hiện ở đầu khung chat) */
export const CHAT_AGENTS: Record<ChatChannel, { name: string; avatar: string | null }> = {
  shop: { name: "Thu Hà", avatar: "/images/ex5.jpg" },
  ai: { name: "AODAI AI", avatar: null },
};

/** Tin chào sẵn khi mở khung chat lần đầu */
export const CHAT_GREETINGS: Record<ChatChannel, LocalizedText[]> = {
  shop: [
    {
      vi: "Xin chào! Mình là Thu Hà, tư vấn viên của AODAI 🌸",
      en: "Hello! I'm Thu Ha, a stylist at AODAI 🌸",
    },
    {
      vi: "Bạn cần tư vấn chọn size, may đo hay kiểm tra đơn hàng? Cứ nhắn cho mình nhé.",
      en: "Need help with sizing, bespoke tailoring or an order? Just send me a message.",
    },
  ],
  ai: [
    {
      vi: "Chào bạn, mình là trợ lý AI của AODAI. Mình có thể gợi ý mẫu áo dài, cách chọn size và chất liệu.",
      en: "Hi, I'm the AODAI AI assistant. I can suggest designs and help with sizing and fabrics.",
    },
  ],
};

/** Câu hỏi gợi ý bấm nhanh */
export const CHAT_SUGGESTIONS: Record<ChatChannel, LocalizedText[]> = {
  shop: [
    { vi: "Tư vấn chọn size", en: "Help me choose a size" },
    { vi: "May đo mất bao lâu?", en: "How long does tailoring take?" },
    { vi: "Kiểm tra đơn hàng", en: "Check my order" },
  ],
  ai: [
    { vi: "Gợi ý áo dài đi cưới", en: "Suggest a wedding ao dai" },
    { vi: "Chất liệu nào mát cho mùa hè?", en: "Which fabric is cool for summer?" },
    { vi: "Cách bảo quản áo lụa", en: "How to care for silk" },
  ],
};

const SHOP_RULES: ChatReplyRule[] = [
  {
    keywords: ["size", "số đo", "kích thước", "vừa", "measure"],
    reply: {
      vi: "Bạn cho mình xin chiều cao, cân nặng và số đo vòng ngực – eo – mông nhé. Mình sẽ gợi ý size phù hợp, hoặc bạn có thể chọn \"May đo\" ở trang sản phẩm.",
      en: "Please share your height, weight and bust – waist – hip measurements. I'll suggest a size, or you can choose \"Custom\" on the product page.",
    },
  },
  {
    keywords: ["may đo", "bao lâu", "mấy ngày", "tailor", "how long"],
    reply: {
      vi: "Áo may đo thường hoàn thiện trong 7–10 ngày làm việc, đã gồm một lần thử áo. Đơn gấp bạn báo trước để xưởng ưu tiên nhé.",
      en: "Bespoke pieces usually take 7–10 working days, including one fitting. Let us know early if you need it sooner.",
    },
  },
  {
    keywords: ["đơn", "giao", "vận chuyển", "ship", "order", "delivery"],
    reply: {
      vi: "Bạn gửi giúp mình mã đơn (bắt đầu bằng AD…) để mình kiểm tra trạng thái ngay. Đơn nội thành thường giao trong 1–2 ngày.",
      en: "Please send your order code (starting with AD…) and I'll check it right away. City orders usually arrive in 1–2 days.",
    },
  },
  {
    keywords: ["giá", "giảm", "khuyến mãi", "voucher", "price", "discount", "sale"],
    reply: {
      vi: "Hiện shop đang có mã FREESHIP cho đơn từ 1.000.000đ và ưu đãi -15% áo dài cưới may đo. Bạn quan tâm mẫu nào để mình báo giá chi tiết?",
      en: "We currently offer FREESHIP on orders over 1,000,000đ and 15% off bespoke wedding ao dai. Which design are you interested in?",
    },
  },
];

const AI_RULES: ChatReplyRule[] = [
  {
    keywords: ["cưới", "cô dâu", "wedding", "bride"],
    reply: {
      vi: "Cho ngày cưới, bạn có thể chọn gấm đỏ đô thêu song hỷ hoặc nhung đỏ tay dài cho phom trang trọng. Nếu muốn nhẹ nhàng hơn, lụa tơ tằm trắng ngà thêu hoa sen cũng rất hợp tiệc cưới ngoài trời.",
      en: "For a wedding, try burgundy brocade with double-happiness embroidery or long-sleeve red velvet for a formal look. For something lighter, ivory silk with lotus embroidery suits outdoor ceremonies.",
    },
  },
  {
    keywords: ["mát", "hè", "nóng", "summer", "cool", "hot"],
    reply: {
      vi: "Mùa hè nên ưu tiên lụa tơ tằm, voan hoặc linen pha — thoáng, nhẹ và ít nhăn. Kiểu tay lỡ, cổ thuyền sẽ dễ chịu hơn tay dài cổ cao.",
      en: "For summer, choose silk, chiffon or linen blends — breathable, light and less prone to creasing. Elbow sleeves and boat necks feel cooler than long sleeves and high collars.",
    },
  },
  {
    keywords: ["bảo quản", "giặt", "lụa", "care", "wash", "silk"],
    reply: {
      vi: "Áo lụa nên giặt tay với nước lạnh và xà phòng trung tính, không vắt mạnh, phơi trong bóng râm. Khi cất, treo móc vai rộng và bọc túi vải để tránh ẩm mốc.",
      en: "Hand-wash silk in cold water with a mild detergent, don't wring it, and dry it in the shade. Store it on a wide hanger inside a cotton bag to avoid mould.",
    },
  },
  {
    keywords: ["size", "số đo", "measure"],
    reply: {
      vi: "Áo dài ôm theo vòng ngực và eo, nên ưu tiên khớp hai số đo này. Nếu bạn ở giữa hai size, chọn size lớn hơn rồi nhờ chỉnh eo, hoặc chọn may đo để vừa nhất.",
      en: "An ao dai is fitted at the bust and waist, so match those first. If you're between sizes, size up and have the waist taken in — or choose bespoke for the best fit.",
    },
  },
];

export const CHAT_RULES: Record<ChatChannel, ChatReplyRule[]> = { shop: SHOP_RULES, ai: AI_RULES };

export const CHAT_FALLBACK: Record<ChatChannel, LocalizedText> = {
  shop: {
    vi: "Cảm ơn bạn đã nhắn! Mình đã ghi nhận và sẽ phản hồi chi tiết trong ít phút nữa nhé.",
    en: "Thanks for your message! I've noted it and will get back to you with details in a few minutes.",
  },
  ai: {
    vi: "Mình chưa chắc về câu hỏi này. Bạn thử hỏi về mẫu áo theo dịp, chất liệu, size hoặc cách bảo quản — hoặc chuyển sang chat với cửa hàng để được tư vấn trực tiếp.",
    en: "I'm not sure about that one. Try asking about designs for an occasion, fabrics, sizing or care — or switch to the shop chat for a stylist.",
  },
};

/** Chọn câu trả lời mẫu theo từ khóa (không phân biệt hoa thường) */
export function pickMockReply(channel: ChatChannel, text: string, locale: "vi" | "en"): string {
  const normalized = text.toLowerCase();
  const rule = CHAT_RULES[channel].find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
  return (rule?.reply ?? CHAT_FALLBACK[channel])[locale];
}

/** Thời gian "đang soạn tin" giả lập (ms) — AI nhanh hơn nhân viên */
export const CHAT_TYPING_DELAY: Record<ChatChannel, number> = { shop: 1600, ai: 900 };
