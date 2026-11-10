import {
  type AdminFabricRoll,
  type AdminFabricStockData,
  type FabricColorOption,
  type FabricMaterialOption,
  type FabricMovement,
  type FabricMovementType,
  type FabricProductOption,
} from "../types/fabrics.types";
import { roundMeters } from "../utils/fabricStock";

/*
 * DỮ LIỆU MOCK TẠM — màn "Số lượng vải" đang dựng giao diện trước.
 * Khi nối DB: thay `getMockFabricStock()` bằng query Prisma (Fabric + Material + AttributeValue màu + Product),
 * và các thao tác trong FabricsBoard bằng Server Action ghi Fabric + bảng lịch sử biến động.
 */

const MATERIALS: FabricMaterialOption[] = [
  { id: "mat-lua", code: "LUA-TO-TAM", name: "Lụa tơ tằm Bảo Lộc", nameEn: "Bao Loc mulberry silk", widthCm: 90, metersPerTop: 2.2, metersPerPants: 1.8 },
  { id: "mat-lanh", code: "LANH-TAY-BAC", name: "Lanh Tây Bắc", nameEn: "Northwest hemp linen", widthCm: 40, metersPerTop: 3.2, metersPerPants: 2.4 },
  { id: "mat-dui", code: "DUI", name: "Đũi Nam Định", nameEn: "Nam Dinh raw silk", widthCm: 90, metersPerTop: 2.4, metersPerPants: 1.8 },
  { id: "mat-gam", code: "GAM", name: "Gấm hoa văn", nameEn: "Brocade", widthCm: 110, metersPerTop: 2, metersPerPants: null },
  { id: "mat-the", code: "THE", name: "The Hà Đông", nameEn: "Ha Dong gauze", widthCm: 90, metersPerTop: 2.5, metersPerPants: null },
  { id: "mat-nhung", code: "NHUNG", name: "Nhung tăm", nameEn: "Corduroy velvet", widthCm: 140, metersPerTop: null, metersPerPants: null },
];

const COLORS: FabricColorOption[] = [
  { id: "c-hong", name: "Hồng phấn", nameEn: "Blush pink", hex: "#E9B9BB" },
  { id: "c-nga", name: "Trắng ngà", nameEn: "Ivory", hex: "#F3EDE0" },
  { id: "c-do", name: "Đỏ đô", nameEn: "Burgundy", hex: "#7B1E2B" },
  { id: "c-cham", name: "Chàm", nameEn: "Indigo", hex: "#2F3E66" },
  { id: "c-ngoc", name: "Xanh ngọc", nameEn: "Jade", hex: "#3E8E85" },
  { id: "c-nghe", name: "Vàng nghệ", nameEn: "Turmeric", hex: "#D6A03A" },
  { id: "c-reu", name: "Xanh rêu", nameEn: "Moss green", hex: "#5C6B46" },
  { id: "c-be", name: "Be mộc", nameEn: "Natural beige", hex: "#D9C8AC" },
  { id: "c-den", name: "Đen tuyền", nameEn: "Jet black", hex: "#1D1D1F" },
  { id: "c-tim", name: "Tím than", nameEn: "Plum", hex: "#3E2F4F" },
];

const PRODUCTS: FabricProductOption[] = [
  { id: "p-1", code: "AD0001", name: "Áo dài lụa Mây Hồng", isVisible: true },
  { id: "p-2", code: "AD0003", name: "Áo dài lanh Sương Sớm", isVisible: true },
  { id: "p-3", code: "AD0004", name: "Áo dài chàm Bản Lác", isVisible: true },
  { id: "p-4", code: "AD0006", name: "Áo dài gấm Hoàng Hôn", isVisible: true },
  { id: "p-5", code: "AD0007", name: "Áo dài the Ngọc Bích", isVisible: false },
  { id: "p-6", code: "AD0009", name: "Áo dài đũi Mùa Gặt", isVisible: true },
];

const ACTORS = ["Thu Hà", "Mai Anh", "Quản trị"];

/** Một bước trong lịch sử cây vải: [loại, mét, cách đây mấy ngày, mã đơn / ghi chú] */
type Step = [FabricMovementType, number, number, string?];

interface RollSeed {
  id: string;
  name: string;
  materialId: string;
  colorId: string;
  code: string;
  received: number;
  receivedDaysAgo: number;
  threshold: number;
  productId: string | null;
  isActive?: boolean;
  steps: Step[];
}

const ROLLS: RollSeed[] = [
  {
    id: "f-01", name: "Lụa tơ tằm hồng phấn", materialId: "mat-lua", colorId: "c-hong", code: "LUA-TO-TAM-HONG-PHAN-01",
    received: 30, receivedDaysAgo: 58, threshold: 4, productId: "p-1",
    steps: [["CUT", 2.2, 40, "TC-2610-7KQ2"], ["CUT", 4, 31, "TC-2610-9MX4"], ["CUT", 2.2, 22, "TC-2610-H3PZ"], ["WASTE", 0.6, 20, "Ố mép khi phơi"], ["CUT", 4, 9, "TC-2611-2TQB"], ["CUT", 2.2, 3, "TC-2611-8LWN"]],
  },
  {
    id: "f-02", name: "Lụa tơ tằm trắng ngà", materialId: "mat-lua", colorId: "c-nga", code: "LUA-TO-TAM-TRANG-NGA-01",
    received: 25, receivedDaysAgo: 75, threshold: 4, productId: null,
    steps: [["CUT", 4, 60, "TC-2609-5RB8"], ["CUT", 4, 44, "TC-2609-Q2DK"], ["CUT", 2.2, 30, "TC-2610-ZK71"], ["CUT", 4, 18, "TC-2610-6YHC"], ["CUT", 4, 11, "TC-2611-3VNE"], ["ADJUST", 2.4, 6, "Đo lại sau kiểm kho tháng 11"]],
  },
  {
    id: "f-03", name: "Lụa tơ tằm đỏ đô", materialId: "mat-lua", colorId: "c-do", code: "LUA-TO-TAM-DO-DO-01",
    received: 20, receivedDaysAgo: 34, threshold: 4, productId: null,
    steps: [["CUT", 4, 26, "TC-2610-B7UJ"], ["CUT", 2.2, 12, "TC-2611-0PLM"]],
  },
  {
    id: "f-04", name: "Lanh chàm Bản Lác", materialId: "mat-lanh", colorId: "c-cham", code: "LANH-TAY-BAC-CHAM-01",
    received: 24, receivedDaysAgo: 90, threshold: 5.6, productId: "p-3",
    steps: [["CUT", 3.2, 70, "TC-2608-4QFS"], ["CUT", 5.6, 52, "TC-2609-WT6A"], ["CUT", 3.2, 41, "TC-2609-NB2X"], ["CUT", 5.6, 21, "TC-2610-R8KD"], ["CUT", 3.2, 8, "TC-2611-5YCU"], ["WASTE", 3.2, 2, "Lỗi nhuộm loang một khúc"]],
  },
  {
    id: "f-05", name: "Lanh be mộc", materialId: "mat-lanh", colorId: "c-be", code: "LANH-TAY-BAC-BE-MOC-01",
    received: 20, receivedDaysAgo: 40, threshold: 5.6, productId: "p-2",
    steps: [["CUT", 3.2, 33, "TC-2610-JM9P"], ["RESTOCK", 12, 15, "Bà Sùng ở Mù Cang Chải giao thêm"], ["CUT", 5.6, 5, "TC-2611-K2ZQ"]],
  },
  {
    id: "f-06", name: "Lanh xanh rêu", materialId: "mat-lanh", colorId: "c-reu", code: "LANH-TAY-BAC-XANH-REU-01",
    received: 16, receivedDaysAgo: 120, threshold: 5.6, productId: null, isActive: false,
    steps: [["CUT", 3.2, 100, "TC-2607-2HDN"], ["CUT", 3.2, 80, "TC-2608-V6TR"], ["WASTE", 1.5, 79, "Mối mọt góc kho"]],
  },
  {
    id: "f-07", name: "Đũi vàng nghệ", materialId: "mat-dui", colorId: "c-nghe", code: "DUI-VANG-NGHE-01",
    received: 30, receivedDaysAgo: 50, threshold: 4.2, productId: "p-6",
    steps: [["CUT", 4.2, 37, "TC-2610-3GSW"], ["CUT", 2.4, 25, "TC-2610-7NJE"], ["CUT", 4.2, 13, "TC-2611-QF8M"]],
  },
  {
    id: "f-08", name: "Đũi trắng ngà", materialId: "mat-dui", colorId: "c-nga", code: "DUI-TRANG-NGA-01",
    received: 18, receivedDaysAgo: 66, threshold: 4.2, productId: "p-6",
    steps: [["CUT", 4.2, 55, "TC-2609-8CQA"], ["CUT", 4.2, 39, "TC-2610-L2VB"], ["CUT", 4.2, 24, "TC-2610-D5XH"], ["CUT", 2.4, 14, "TC-2611-6ZRT"], ["CUT", 3, 4, "TC-2611-YP3K"]],
  },
  {
    id: "f-09", name: "Gấm đỏ đô hoa sen", materialId: "mat-gam", colorId: "c-do", code: "GAM-DO-DO-01",
    received: 15, receivedDaysAgo: 28, threshold: 2, productId: "p-4",
    steps: [["CUT", 2, 19, "TC-2610-TT4S"], ["CUT", 2, 7, "TC-2611-A9KE"]],
  },
  {
    id: "f-10", name: "Gấm tím than", materialId: "mat-gam", colorId: "c-tim", code: "GAM-TIM-THAN-01",
    received: 12, receivedDaysAgo: 46, threshold: 2, productId: "p-4",
    steps: [["CUT", 2, 36, "TC-2610-UE2B"], ["CUT", 2, 27, "TC-2610-H8RL"], ["CUT", 2, 16, "TC-2611-PL6D"], ["CUT", 2, 10, "TC-2611-JC5N"], ["CUT", 2, 6, "TC-2611-F7WX"], ["ADJUST", 1.2, 1, "Còn mẩu thừa, không đủ một thân"]],
  },
  {
    id: "f-11", name: "The xanh ngọc", materialId: "mat-the", colorId: "c-ngoc", code: "THE-XANH-NGOC-01",
    received: 10, receivedDaysAgo: 80, threshold: 2.5, productId: "p-5",
    steps: [["CUT", 2.5, 62, "TC-2609-MG3V"], ["CUT", 2.5, 48, "TC-2609-2KWS"], ["CUT", 2.5, 29, "TC-2610-XQ7A"], ["CUT", 2.5, 17, "TC-2611-4BHR"]],
  },
  {
    id: "f-12", name: "Nhung tăm đen tuyền", materialId: "mat-nhung", colorId: "c-den", code: "NHUNG-DEN-TUYEN-01",
    received: 14, receivedDaysAgo: 21, threshold: 3, productId: null,
    steps: [["CUT", 2.6, 12, "TC-2611-9DQE"]],
  },
];

const DAY = 24 * 60 * 60 * 1000;

function buildRoll(seed: RollSeed, now: number): AdminFabricRoll {
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();
  let balance = seed.received;
  const movements: FabricMovement[] = [
    { id: `${seed.id}-0`, type: "RESTOCK", delta: seed.received, balanceAfter: balance, orderCode: null, note: null, actorName: ACTORS[2], createdAt: at(seed.receivedDaysAgo) },
  ];
  seed.steps.forEach(([type, meters, daysAgo, ref], index) => {
    const before = balance;
    balance = roundMeters(type === "ADJUST" ? meters : type === "RESTOCK" ? balance + meters : balance - meters);
    const isOrder = type === "CUT" && ref?.startsWith("TC-");
    movements.push({
      id: `${seed.id}-${index + 1}`,
      type,
      delta: roundMeters(balance - before),
      balanceAfter: balance,
      orderCode: isOrder ? (ref ?? null) : null,
      note: isOrder ? null : (ref ?? null),
      actorName: ACTORS[index % 2],
      createdAt: at(daysAgo),
    });
  });

  return {
    id: seed.id,
    code: seed.code,
    name: seed.name,
    materialId: seed.materialId,
    colorId: seed.colorId,
    receivedMeters: seed.received,
    remainingMeters: balance,
    lowStockThreshold: seed.threshold,
    isActive: seed.isActive ?? true,
    productId: seed.productId,
    receivedAt: at(seed.receivedDaysAgo),
    updatedAt: movements[movements.length - 1].createdAt,
    movements: movements.reverse(),
  };
}

/** Toàn bộ dữ liệu màn "Số lượng vải" (mock) — ngày tháng tính lùi từ thời điểm gọi */
export function getMockFabricStock(): AdminFabricStockData {
  const now = Date.now();
  return {
    rolls: ROLLS.map((seed) => buildRoll(seed, now)),
    materials: MATERIALS,
    colors: COLORS,
    products: PRODUCTS,
    now: new Date(now).toISOString(),
  };
}
