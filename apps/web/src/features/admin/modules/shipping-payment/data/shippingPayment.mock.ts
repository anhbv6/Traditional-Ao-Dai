import { type Province, type ShippingPaymentData } from "../types/shippingPayment.types";

/*
 * DỮ LIỆU MOCK TẠM — màn Vận chuyển & thanh toán dựng giao diện trước. Hiện API tính phí cố định
 * `STANDARD_SHIPPING_FEE` và đọc tài khoản nhận tiền từ biến môi trường `BANK_*`. Khi nối DB: bảng cấu hình một dòng
 * (hoặc ShippingZone + Carrier + ShopSetting), thay `getMockShippingPayment()` bằng query Prisma, lưu bằng Server Action
 * `authorizeAdminAction({ role: "ADMIN" })` + `recordAudit("SHIPPING_PAYMENT_UPDATED")`, rồi `orders.service` tính phí
 * bằng `quoteShipping` / `paymentOptions` thay cho hằng số.
 */

/** 34 tỉnh / thành theo địa giới mới từ 07/2025 */
const PROVINCES: Province[] = [
  ["HN", "Hà Nội", "NORTH"],
  ["HP", "Hải Phòng", "NORTH"],
  ["QNI", "Quảng Ninh", "NORTH"],
  ["BN", "Bắc Ninh", "NORTH"],
  ["HY", "Hưng Yên", "NORTH"],
  ["NB", "Ninh Bình", "NORTH"],
  ["PT", "Phú Thọ", "NORTH"],
  ["TN", "Thái Nguyên", "NORTH"],
  ["TQ", "Tuyên Quang", "NORTH"],
  ["LS", "Lạng Sơn", "NORTH"],
  ["CB", "Cao Bằng", "NORTH"],
  ["LC", "Lào Cai", "NORTH"],
  ["SL", "Sơn La", "NORTH"],
  ["DB", "Điện Biên", "NORTH"],
  ["LCH", "Lai Châu", "NORTH"],
  ["TH", "Thanh Hóa", "CENTRAL"],
  ["NA", "Nghệ An", "CENTRAL"],
  ["HT", "Hà Tĩnh", "CENTRAL"],
  ["QT", "Quảng Trị", "CENTRAL"],
  ["HUE", "Huế", "CENTRAL"],
  ["DN", "Đà Nẵng", "CENTRAL"],
  ["QNG", "Quảng Ngãi", "CENTRAL"],
  ["GL", "Gia Lai", "CENTRAL"],
  ["KH", "Khánh Hòa", "CENTRAL"],
  ["DL", "Đắk Lắk", "CENTRAL"],
  ["LD", "Lâm Đồng", "CENTRAL"],
  ["HCM", "TP. Hồ Chí Minh", "SOUTH"],
  ["DNA", "Đồng Nai", "SOUTH"],
  ["TNI", "Tây Ninh", "SOUTH"],
  ["CT", "Cần Thơ", "SOUTH"],
  ["VL", "Vĩnh Long", "SOUTH"],
  ["DT", "Đồng Tháp", "SOUTH"],
  ["CM", "Cà Mau", "SOUTH"],
  ["AG", "An Giang", "SOUTH"],
].map(([code, name, region]) => ({ code: code!, name: name!, region: region as Province["region"] }));

const BANKS = [
  { bin: "970407", name: "Techcombank" },
  { bin: "970436", name: "Vietcombank" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank" },
  { bin: "970422", name: "MB Bank" },
  { bin: "970416", name: "ACB" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970403", name: "Sacombank" },
];

export function getMockShippingPayment(): ShippingPaymentData {
  const now = Date.now();
  return {
    provinces: PROVINCES,
    banks: BANKS,
    updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedBy: "Thu Hà",
    now: new Date(now).toISOString(),
    settings: {
      zones: [
        { id: "z-hcm", name: "Nội thành TP. Hồ Chí Minh", provinceCodes: ["HCM"], baseFee: 20_000, extraItemFee: 0, etaMinDays: 0, etaMaxDays: 1, carrierId: "c-shop", freeShipEligible: true },
        { id: "z-south", name: "Miền Nam", provinceCodes: ["DNA", "TNI", "CT", "VL", "DT", "CM", "AG"], baseFee: 30_000, extraItemFee: 5_000, etaMinDays: 1, etaMaxDays: 3, carrierId: "c-ghn", freeShipEligible: true },
        { id: "z-central", name: "Miền Trung & Tây Nguyên", provinceCodes: ["TH", "NA", "HT", "QT", "HUE", "DN", "QNG", "GL", "KH", "DL", "LD"], baseFee: 35_000, extraItemFee: 5_000, etaMinDays: 2, etaMaxDays: 4, carrierId: "c-ghn", freeShipEligible: true },
        { id: "z-north", name: "Miền Bắc", provinceCodes: ["HN", "HP", "QNI", "BN", "HY", "NB", "PT", "TN", "TQ", "LS"], baseFee: 35_000, extraItemFee: 5_000, etaMinDays: 3, etaMaxDays: 5, carrierId: "c-vtp", freeShipEligible: true },
        // Vùng cao — quê hương những thước vải của tiệm, đường xa nên không miễn phí theo ngưỡng
        { id: "z-highland", name: "Vùng cao Tây Bắc", provinceCodes: ["LC", "SL", "DB", "LCH"], baseFee: 55_000, extraItemFee: 10_000, etaMinDays: 4, etaMaxDays: 7, carrierId: "c-vtp", freeShipEligible: false },
      ],
      carriers: [
        { id: "c-shop", name: "Tiệm tự giao", kind: "SHOP_DELIVERY", isActive: true, note: "Anh Tuấn giao chiều 15:00–19:00, gọi khách trước 30 phút." },
        { id: "c-ghn", name: "Giao Hàng Nhanh", kind: "COURIER", isActive: true, note: "Lấy hàng 10:00 hằng ngày tại showroom." },
        { id: "c-vtp", name: "Viettel Post", kind: "COURIER", isActive: true, note: "Gửi tại bưu cục gần tiệm trước 16:00." },
        { id: "c-ghtk", name: "Giao Hàng Tiết Kiệm", kind: "COURIER", isActive: false, note: "Tạm ngưng từ 09/2026 — hay làm nhăn áo dài." },
        { id: "c-pickup", name: "Nhận tại showroom", kind: "PICKUP", isActive: true, note: "Showroom Quận 1, mở 9:00–21:00 — nhắn khách khi áo đã là phẳng." },
      ],
      freeShipping: { enabled: true, threshold: 2_000_000, tailoredAlwaysFree: true },
      fulfillment: {
        prepDays: 1,
        cutoffTime: "15:00",
        giftWrapEnabled: true,
        giftWrapFee: 30_000,
        pause: { from: "2027-02-01", to: "2027-02-12", message: "Tiệm nghỉ Tết Đinh Mùi — đơn đặt trong thời gian này giao từ 13/02." },
      },
      methods: [
        { method: "BANK_TRANSFER", enabled: true, customerNote: "Quét mã VietQR — tiệm xác nhận đơn trong giờ làm việc." },
        { method: "DEPOSIT", enabled: true, customerNote: "Cọc trước, phần còn lại trả khi nhận áo." },
        { method: "COD", enabled: true, customerNote: "Kiểm tra áo trước khi trả tiền cho người giao." },
      ],
      cod: { maxOrderValue: 5_000_000, verifiedPhoneOnly: false },
      deposit: { percent: 30, requiredAbove: 4_000_000 },
      bank: { bankBin: "970407", bankName: "Techcombank", accountNumber: "19034567891011", accountName: "TIEM AO DAI THIEN CANH", branch: "Chi nhánh Sài Gòn" },
      deadline: { remindAfterHours: 12, autoCancelAfterHours: 48 },
    },
  };
}
