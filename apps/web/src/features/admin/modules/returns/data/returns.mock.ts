import { type AfterSalesTicket, type ReturnsDeskData, type TicketEvent } from "../types/returns.types";

/*
 * DỮ LIỆU MOCK TẠM — màn Bảo hành & hoàn trả dựng giao diện trước (Backend chưa có module hậu mãi,
 * form storefront `features/after-sales` cũng đang giả lập). Khi nối DB: bảng phiếu + nhật ký phiếu,
 * thay `getMockReturnsDesk()` bằng query Prisma và các thao tác bằng Server Action (hoàn tiền qua ApprovalRequest REFUND).
 */

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/** [loại sự kiện, cách đây bao lâu (giờ), ghi chú, người làm] — mới nhất ĐẦU mảng */
type EventSeed = [TicketEvent["kind"], number, string | null, string];

type Seed = Omit<AfterSalesTicket, "createdAt" | "deliveredAt" | "appointmentAt" | "events"> & {
  createdHoursAgo: number;
  deliveredDaysBefore: number;
  appointmentInHours: number | null;
  events: EventSeed[];
};

const SEEDS: Seed[] = [
  {
    id: "t-01", code: "RQ-7K2QAB", service: "ALTERATION", reason: "TOO_LOOSE", status: "NEW",
    description: "Eo áo hơi rộng khoảng 2 phân, mặc lên bị phồng phía sau. Nhờ tiệm bóp lại giúp em trước ngày 20/11 ạ.",
    orderCode: "TC-2611-2TQB", productName: "Áo dài lụa Mây Hồng", variantName: "Hồng phấn · M", image: null,
    isCustomFit: false, itemPrice: 1_890_000, customerName: "Nguyễn Thảo Vy", customerPhone: "0912 345 678",
    handover: "STORE", trackingCode: null, fee: 0, photoCount: 3,
    createdHoursAgo: 5, deliveredDaysBefore: 9, appointmentInHours: null,
    events: [["SUBMITTED", 5, null, "Khách"]],
  },
  {
    id: "t-02", code: "RQ-M3PZ8D", service: "RETURN", reason: "NOT_AS_DESCRIBED", status: "NEW",
    description: "Màu ngoài thực tế đậm hơn ảnh trên web khá nhiều, em muốn trả hàng.",
    orderCode: "TC-2611-8LWN", productName: "Áo dài lanh Sương Sớm", variantName: "Be mộc · S", image: null,
    isCustomFit: false, itemPrice: 1_450_000, customerName: "Phạm Khánh Linh", customerPhone: "0987 222 019",
    handover: "POST", trackingCode: null, fee: 0, photoCount: 4,
    createdHoursAgo: 30, deliveredDaysBefore: 4, appointmentInHours: null,
    events: [["SUBMITTED", 30, null, "Khách"]],
  },
  {
    id: "t-03", code: "RQ-QF8M2C", service: "EXCHANGE", reason: "WRONG_SIZE", status: "NEW",
    description: "Áo may đo nhưng mặc vẫn chật vai, muốn đổi sang size L may sẵn.",
    orderCode: "TC-2610-6YHC", productName: "Áo dài gấm Hoàng Hôn", variantName: "May đo", image: null,
    isCustomFit: true, itemPrice: 3_200_000, customerName: "Lê Hoài An", customerPhone: "0903 777 456",
    handover: "STORE", trackingCode: null, fee: 0, photoCount: 2,
    createdHoursAgo: 52, deliveredDaysBefore: 12, appointmentInHours: null,
    events: [["SUBMITTED", 52, null, "Khách"]],
  },
  {
    id: "t-04", code: "RQ-H3PZ71", service: "WARRANTY", reason: "EMBROIDERY", status: "ACCEPTED",
    description: "Đường thêu hoa sen ở vạt trước bị sút 3 mũi sau lần giặt tay đầu tiên.",
    orderCode: "TC-2608-4QFS", productName: "Áo dài chàm Bản Lác", variantName: "Chàm · M", image: null,
    isCustomFit: false, itemPrice: 2_150_000, customerName: "Đỗ Minh Thư", customerPhone: "0935 101 202",
    handover: "POST", trackingCode: "VTP 8812 4410 22", fee: 0, photoCount: 5,
    createdHoursAgo: 80, deliveredDaysBefore: 64, appointmentInHours: null,
    events: [
      ["ACCEPTED", 70, "Đã nhắn khách gửi qua Viettel Post, tiệm chịu phí ship chiều về.", "Thu Hà"],
      ["SUBMITTED", 80, null, "Khách"],
    ],
  },
  {
    id: "t-05", code: "RQ-ZK71BV", service: "ALTERATION", reason: "LENGTH", status: "ACCEPTED",
    description: "Tà áo dài quá so với giày cao 5 phân, nhờ tiệm lên lai khoảng 3 phân.",
    orderCode: "TC-2610-B7UJ", productName: "Áo dài lụa đỏ đô", variantName: "May đo", image: null,
    isCustomFit: true, itemPrice: 2_600_000, customerName: "Trịnh Bảo Ngọc", customerPhone: "0977 456 123",
    handover: "STORE", trackingCode: null, fee: 0, photoCount: 1,
    createdHoursAgo: 46, deliveredDaysBefore: 18, appointmentInHours: 20,
    events: [
      ["ACCEPTED", 40, "Hẹn khách mang áo tới tiệm, mang theo giày để đo lại.", "Mai Anh"],
      ["SUBMITTED", 46, null, "Khách"],
    ],
  },
  {
    id: "t-06", code: "RQ-6YHC2P", service: "ALTERATION", reason: "SLEEVE", status: "RECEIVED",
    description: "Tay áo dài quá cổ tay, muốn sửa ngắn lại 2 phân.",
    orderCode: "TC-2610-JM9P", productName: "Áo dài đũi Mùa Gặt", variantName: "Vàng nghệ · L", image: null,
    isCustomFit: false, itemPrice: 1_650_000, customerName: "Hoàng Gia Hân", customerPhone: "0908 333 999",
    handover: "STORE", trackingCode: null, fee: 0, photoCount: 2,
    createdHoursAgo: 150, deliveredDaysBefore: 20, appointmentInHours: null,
    events: [
      ["RECEIVED", 100, "Khách đã gửi áo tại quầy, đo lại tay 56 → 54 cm.", "Thu Hà"],
      ["ACCEPTED", 140, null, "Thu Hà"],
      ["SUBMITTED", 150, null, "Khách"],
    ],
  },
  {
    id: "t-07", code: "RQ-NB2X9Q", service: "RETURN", reason: "WRONG_ITEM", status: "RECEIVED",
    description: "Tiệm giao nhầm sang màu xanh rêu, em đặt màu be.",
    orderCode: "TC-2610-XQ7A", productName: "Áo dài lanh xanh rêu", variantName: "Xanh rêu · M", image: null,
    isCustomFit: false, itemPrice: 1_450_000, customerName: "Vũ Thanh Mai", customerPhone: "0966 888 210",
    handover: "POST", trackingCode: "GHN 5L7Q2K", fee: 0, photoCount: 3,
    createdHoursAgo: 200, deliveredDaysBefore: 2, appointmentInHours: null,
    events: [
      ["RECEIVED", 30, "Đã nhận hàng hoàn, áo còn nguyên tem.", "Mai Anh"],
      ["ACCEPTED", 190, "Lỗi của tiệm — tiệm chịu phí gửi.", "Quản trị"],
      ["SUBMITTED", 200, null, "Khách"],
    ],
  },
  {
    id: "t-08", code: "RQ-R8KD4T", service: "WARRANTY", reason: "SEAM", status: "READY",
    description: "Bung chỉ đường may sườn trái khoảng 4 phân.",
    orderCode: "TC-2609-WT6A", productName: "Áo dài the Ngọc Bích", variantName: "Xanh ngọc · S", image: null,
    isCustomFit: false, itemPrice: 1_980_000, customerName: "Ngô Thùy Dương", customerPhone: "0914 600 700",
    handover: "STORE", trackingCode: null, fee: 0, photoCount: 2,
    createdHoursAgo: 260, deliveredDaysBefore: 70, appointmentInHours: 28,
    events: [
      ["READY", 20, "Đã may lại đường sườn, ủi phẳng. Hẹn khách lấy chiều mai.", "Thu Hà"],
      ["RECEIVED", 200, null, "Thu Hà"],
      ["ACCEPTED", 250, null, "Mai Anh"],
      ["SUBMITTED", 260, null, "Khách"],
    ],
  },
  {
    id: "t-09", code: "RQ-5YCU8E", service: "ALTERATION", reason: "TOO_TIGHT", status: "DONE",
    description: "Ngực hơi chật, nhờ nới thêm.",
    orderCode: "TC-2610-3GSW", productName: "Áo dài lụa trắng ngà", variantName: "Trắng ngà · S", image: null,
    isCustomFit: false, itemPrice: 1_890_000, customerName: "Bùi Lan Chi", customerPhone: "0938 121 343",
    handover: "STORE", trackingCode: null, fee: 0, photoCount: 1,
    createdHoursAgo: 400, deliveredDaysBefore: 15, appointmentInHours: null,
    events: [
      ["DONE", 120, "Khách đã nhận áo, mặc thử vừa.", "Mai Anh"],
      ["READY", 170, null, "Thu Hà"],
      ["RECEIVED", 330, null, "Thu Hà"],
      ["ACCEPTED", 390, null, "Thu Hà"],
      ["SUBMITTED", 400, null, "Khách"],
    ],
  },
  {
    id: "t-10", code: "RQ-UE2B6M", service: "EXCHANGE", reason: "CHANGE_COLOR", status: "REJECTED",
    description: "Em muốn đổi sang màu tím than.",
    orderCode: "TC-2609-8CQA", productName: "Áo dài gấm đỏ đô", variantName: "Đỏ đô · M", image: null,
    isCustomFit: false, itemPrice: 2_400_000, customerName: "Tạ Phương Nhi", customerPhone: "0973 444 555",
    handover: "STORE", trackingCode: null, fee: 0, photoCount: 0,
    createdHoursAgo: 500, deliveredDaysBefore: 26, appointmentInHours: null,
    events: [
      ["REJECTED", 480, "Quá hạn đổi 7 ngày (đã nhận hàng 26 ngày). Đã gọi giải thích, gợi ý sửa đồ miễn phí.", "Quản trị"],
      ["SUBMITTED", 500, null, "Khách"],
    ],
  },
];

/** Bàn tiếp nhận hậu mãi (mock) — mốc thời gian tính lùi từ lúc gọi */
export function getMockReturnsDesk(): ReturnsDeskData {
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const tickets: AfterSalesTicket[] = SEEDS.map(({ createdHoursAgo, deliveredDaysBefore, appointmentInHours, events, ...seed }) => {
    const createdAt = now - createdHoursAgo * HOUR;
    return {
      ...seed,
      createdAt: iso(createdAt),
      deliveredAt: iso(createdAt - deliveredDaysBefore * DAY),
      appointmentAt: appointmentInHours === null ? null : iso(now + appointmentInHours * HOUR),
      events: events.map(([kind, hoursAgo, note, actorName], index) => ({
        id: `${seed.id}-e${index}`,
        kind,
        note,
        actorName,
        createdAt: iso(now - hoursAgo * HOUR),
      })),
    };
  });
  return { tickets, now: iso(now) };
}
