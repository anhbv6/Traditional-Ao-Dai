import {
  type AdminSaleEvent,
  type SaleActivity,
  type SaleCatalog,
  type SaleCatalogProduct,
  type SaleEventEditorData,
  type SaleEventsBoardData,
  type SaleProductRule,
  type SaleStats,
} from "../types/saleEvents.types";
import { DAY_MS, HOUR_MS } from "../utils/saleRules";

/*
 * DỮ LIỆU MOCK TẠM — màn Chương trình sale dựng giao diện trước (chưa có bảng SaleEvent). Khi nối DB:
 * bảng SaleEvent + SaleEventProduct (giá đặt tay, suất, đã bán) + nhật ký qua AuditLog; thay các hàm `getMock*`
 * bằng query Prisma, thao tác bằng Server Action (`authorizeAdminAction({ role: "ADMIN" })`), giá sale tính lại ở
 * server bằng `computeSalePrice` khi đặt hàng. Mốc thời gian tính tương đối theo lúc mở trang để màn luôn "sống".
 */

const COLLECTIONS = [
  { id: "col-lua-may", name: "Lụa & Mây · Thu đông 2026" },
  { id: "col-cham", name: "Chàm Bản Lác" },
  { id: "col-xuan", name: "Xuân Đinh Mùi 2027" },
  { id: "col-cuoi", name: "Vu quy" },
];

const CATEGORIES = [
  { id: "cat-truyen-thong", name: "Áo dài truyền thống", group: "AO_DAI" as const },
  { id: "cat-cach-tan", name: "Áo dài cách tân", group: "AO_DAI" as const },
  { id: "cat-cuoi", name: "Áo dài cưới", group: "AO_DAI" as const },
  { id: "cat-quan-lua", name: "Quần lụa", group: "PANTS" as const },
  { id: "cat-khan-van", name: "Khăn vấn & trâm", group: "ACCESSORY" as const },
  { id: "cat-tui", name: "Túi & ví thổ cẩm", group: "ACCESSORY" as const },
  { id: "cat-guoc", name: "Guốc mộc", group: "FOOTWEAR" as const },
];

const categoryName = (id: string) => CATEGORIES.find((category) => category.id === id)?.name ?? "";

type ProductSeed = [id: string, code: string, name: string, categoryId: string, collections: string[], mode: SaleCatalogProduct["saleMode"], price: number, stock: number | null, active?: boolean];

const PRODUCT_SEEDS: ProductSeed[] = [
  ["p-01", "AD0001", "Áo dài lụa Mây Hồng", "cat-truyen-thong", ["col-lua-may"], "SINGLE", 1_890_000, 14],
  ["p-02", "AD0002", "Áo dài lanh Sương Sớm", "cat-truyen-thong", ["col-lua-may"], "SINGLE", 1_450_000, 22],
  ["p-03", "AD0003", "Áo dài chàm Bản Lác", "cat-truyen-thong", ["col-cham"], "SINGLE", 2_150_000, 6],
  ["p-04", "AD0004", "Bộ áo dài gấm Hoàng Hôn", "cat-truyen-thong", ["col-lua-may", "col-xuan"], "SET", 3_200_000, 9],
  ["p-05", "AD0005", "Áo dài cách tân Mận Chín", "cat-cach-tan", ["col-lua-may"], "SINGLE", 1_290_000, 31],
  ["p-06", "AD0006", "Áo dài cách tân Nắng Mường Hoa", "cat-cach-tan", ["col-xuan"], "SINGLE", 1_190_000, 40],
  ["p-07", "AD0007", "Áo dài thêu sen Tây Hồ", "cat-truyen-thong", ["col-xuan"], "SINGLE", 2_690_000, 4],
  ["p-08", "AD0008", "Áo dài may đo lụa tơ tằm", "cat-truyen-thong", [], "CUSTOM", 3_500_000, null],
  ["p-09", "AD0009", "Áo dài cưới Đỏ Son", "cat-cuoi", ["col-cuoi"], "CUSTOM", 5_800_000, null],
  ["p-10", "AD0010", "Áo dài cưới Trắng Ngà", "cat-cuoi", ["col-cuoi"], "SINGLE", 4_900_000, 3],
  ["p-11", "AD0011", "Áo dài chàm thêu Hoa Ban", "cat-cach-tan", ["col-cham"], "SINGLE", 1_690_000, 12],
  ["p-12", "QU0001", "Quần lụa ống suông trắng", "cat-quan-lua", ["col-lua-may"], "SINGLE", 450_000, 58],
  ["p-13", "QU0002", "Quần lụa đen mềm", "cat-quan-lua", [], "SINGLE", 420_000, 47],
  ["p-14", "PK0001", "Khăn vấn nhung đỏ", "cat-khan-van", ["col-xuan", "col-cuoi"], "SINGLE", 320_000, 26],
  ["p-15", "PK0002", "Trâm cài gỗ mun", "cat-khan-van", [], "SINGLE", 240_000, 35],
  ["p-16", "PK0003", "Túi thổ cẩm Mông", "cat-tui", ["col-cham"], "SINGLE", 380_000, 18],
  ["p-17", "PK0004", "Ví cầm tay thêu chỉ", "cat-tui", [], "SINGLE", 260_000, 0],
  ["p-18", "GG0001", "Guốc mộc sơn mài", "cat-guoc", [], "SINGLE", 520_000, 15],
  ["p-19", "GG0002", "Guốc mộc quai nhung", "cat-guoc", ["col-xuan"], "SINGLE", 460_000, 9],
  ["p-20", "AD0012", "Áo dài lụa Trăng Rằm (ngừng bán)", "cat-truyen-thong", ["col-lua-may"], "SINGLE", 1_750_000, 0, false],
];

function buildCatalog(): SaleCatalog {
  return {
    products: PRODUCT_SEEDS.map(([id, code, name, categoryId, collectionIds, saleMode, basePrice, stock, active]) => ({
      id,
      code,
      name,
      group: CATEGORIES.find((category) => category.id === categoryId)?.group ?? "AO_DAI",
      categoryId,
      categoryName: categoryName(categoryId),
      collectionIds,
      saleMode,
      basePrice,
      stock,
      isActive: active ?? true,
    })),
    collections: COLLECTIONS,
    categories: CATEGORIES,
  };
}

/** Dải doanh thu theo ngày giả lập — lên xuống tự nhiên, cuối tuần cao hơn */
function dailySeries(days: number, base: number, seed: number): number[] {
  return Array.from({ length: Math.max(days, 1) }, (_, index) => {
    const wave = Math.sin((index + seed) * 1.7) * 0.35 + Math.cos((index + seed) * 0.6) * 0.2;
    const weekend = (index + seed) % 7 >= 5 ? 0.45 : 0;
    return Math.max(0, Math.round((base * (1 + wave + weekend)) / 10_000) * 10_000);
  });
}

function stats(days: number, base: number, seed: number, top: [string, number, number][], discountRatio: number): SaleStats {
  const dailyRevenue = dailySeries(days, base, seed);
  const revenue = dailyRevenue.reduce((sum, value) => sum + value, 0);
  const units = top.reduce((sum, [, count]) => sum + count, 0) + Math.round(days * 0.8);
  return {
    orders: Math.max(1, Math.round(units * 0.78)),
    units,
    revenue,
    discountGiven: Math.round((revenue * discountRatio) / 1000) * 1000,
    dailyRevenue,
    topProducts: top.map(([productId, count, value]) => ({ productId, units: count, revenue: value })),
  };
}

type ActivitySeed = [kind: SaleActivity["kind"], hoursAgo: number, actor: string, note?: string];

function activity(now: number, seeds: ActivitySeed[]): SaleActivity[] {
  return seeds.map(([kind, hoursAgo, actor, note], index) => ({
    id: `a-${index}-${kind}`,
    kind,
    at: new Date(now - hoursAgo * HOUR_MS).toISOString(),
    actor,
    note: note ?? null,
  }));
}

const rules = (entries: [string, number | null, number | null, number][]): Record<string, SaleProductRule> =>
  Object.fromEntries(entries.map(([id, overridePrice, quota, sold]) => [id, { overridePrice, quota, sold }]));

/** Đầu giờ theo giờ tiệm, lệch `days` ngày so với hôm nay */
function at(now: number, days: number, hour = 0): string {
  const shopMidnight = Math.floor((now + 7 * HOUR_MS) / DAY_MS) * DAY_MS - 7 * HOUR_MS;
  return new Date(shopMidnight + days * DAY_MS + hour * HOUR_MS).toISOString();
}

function buildEvents(now: number): AdminSaleEvent[] {
  const base = {
    nameEn: null,
    badgeEn: null,
    description: null,
    descriptionEn: null,
    endedEarlyAt: null,
    excludeCustom: true,
    excludedProductIds: [],
    productRules: {},
    perCustomerLimit: null,
    stackWithCoupon: false,
    showCountdown: true,
    featuredOnHome: false,
    stats: null,
    createdBy: "Thu Hà",
  } satisfies Partial<AdminSaleEvent>;

  return [
    {
      ...base,
      id: "s-nha-giao",
      name: "Tri ân Ngày Nhà giáo 20/11",
      nameEn: "Teachers' Day thank-you",
      badge: "Tri ân 20/11",
      badgeEn: "Teachers' Day",
      description: "Giảm 15% áo dài truyền thống — món quà gửi cô giáo, chậm rãi như một lời cảm ơn.",
      descriptionEn: "15% off traditional áo dài — a slow, handmade thank-you.",
      startAt: at(now, -3, 8),
      endAt: at(now, 11, 0),
      status: "PUBLISHED",
      discountType: "PERCENTAGE",
      value: 15,
      scope: "CATEGORIES",
      scopeIds: ["cat-truyen-thong"],
      productRules: rules([
        ["p-03", null, 5, 4],
        ["p-07", 2_290_000, 3, 1],
        ["p-01", null, null, 6],
      ]),
      perCustomerLimit: 2,
      featuredOnHome: true,
      stats: stats(3, 6_200_000, 2, [["p-01", 6, 9_640_000], ["p-03", 4, 7_320_000], ["p-02", 3, 3_710_000]], 0.17),
      activity: activity(now, [
        ["PRICE_OVERRIDE", 20, "Thu Hà", "Áo thêu sen để 2.290.000 ₫ — chỉ còn 4 chiếc, giữ giá cao hơn mức chung."],
        ["PUBLISHED", 96, "Minh Anh"],
        ["CREATED", 170, "Thu Hà"],
      ]),
      updatedAt: at(now, -1, 14),
    },
    {
      ...base,
      id: "s-xa-thu-dong",
      name: "Xả kho Lụa & Mây thu đông",
      nameEn: "Silk & Cloud autumn clearance",
      badge: "Giảm 200K",
      badgeEn: "200K off",
      description: "Những thước lụa cuối mùa — giảm thẳng 200.000 ₫ mỗi món.",
      startAt: at(now, -12, 0),
      endAt: at(now, 2, 23),
      status: "PUBLISHED",
      discountType: "FIXED_AMOUNT",
      value: 200_000,
      scope: "COLLECTIONS",
      scopeIds: ["col-lua-may"],
      excludedProductIds: ["p-12"],
      productRules: rules([
        ["p-05", null, 20, 18],
        ["p-02", null, 15, 9],
      ]),
      stackWithCoupon: true,
      stats: stats(12, 4_100_000, 5, [["p-05", 18, 19_620_000], ["p-02", 9, 11_250_000], ["p-04", 4, 12_000_000]], 0.13),
      activity: activity(now, [
        ["UPDATED", 50, "Minh Anh", "Bỏ quần lụa ra khỏi chương trình — hàng mới về, chưa xả."],
        ["PUBLISHED", 300, "Thu Hà"],
        ["CREATED", 320, "Thu Hà"],
      ]),
      updatedAt: at(now, -2, 10),
    },
    {
      ...base,
      id: "s-guoc-cuoi-tuan",
      name: "Flash sale guốc mộc cuối tuần",
      nameEn: "Weekend clog flash sale",
      badge: "Flash −30%",
      badgeEn: "Flash −30%",
      startAt: at(now, -2, 9),
      endAt: at(now, 1, 21),
      status: "PAUSED",
      discountType: "PERCENTAGE",
      value: 30,
      scope: "PRODUCTS",
      scopeIds: ["p-18", "p-19"],
      productRules: rules([
        ["p-18", null, 10, 7],
        ["p-19", null, 10, 3],
      ]),
      perCustomerLimit: 1,
      stats: stats(2, 1_300_000, 1, [["p-18", 7, 2_548_000], ["p-19", 3, 966_000]], 0.3),
      activity: activity(now, [
        ["PAUSED", 6, "Minh Anh", "Xưởng gỗ báo chậm hàng guốc sơn mài — dừng tới khi có hàng."],
        ["PUBLISHED", 60, "Minh Anh"],
        ["CREATED", 75, "Minh Anh"],
      ]),
      updatedAt: at(now, 0, 4),
    },
    {
      ...base,
      id: "s-dong-gia-pk",
      name: "Đồng giá phụ kiện 199K",
      nameEn: null,
      badge: "Đồng giá 199K",
      startAt: at(now, 5, 0),
      endAt: at(now, 19, 0),
      status: "PUBLISHED",
      discountType: "FIXED_PRICE",
      value: 199_000,
      scope: "CATEGORIES",
      scopeIds: ["cat-khan-van", "cat-tui"],
      perCustomerLimit: 3,
      showCountdown: false,
      activity: activity(now, [
        ["PUBLISHED", 28, "Thu Hà"],
        ["CREATED", 40, "Thu Hà"],
      ]),
      updatedAt: at(now, -1, 9),
    },
    {
      ...base,
      id: "s-black-friday",
      name: "Black Friday — Thứ Sáu chậm",
      nameEn: "Slow Friday",
      badge: "Black Friday",
      badgeEn: "Black Friday",
      description: "Bốn ngày giảm 20% toàn tiệm, trừ áo may đo.",
      descriptionEn: "Four days, 20% off everything except made-to-measure.",
      startAt: at(now, 17, 0),
      endAt: at(now, 21, 0),
      status: "PUBLISHED",
      discountType: "PERCENTAGE",
      value: 20,
      scope: "ALL",
      scopeIds: [],
      productRules: rules([["p-10", null, 2, 0]]),
      perCustomerLimit: 2,
      activity: activity(now, [["PUBLISHED", 10, "Thu Hà"], ["CREATED", 30, "Thu Hà"]]),
      updatedAt: at(now, 0, 2),
    },
    {
      ...base,
      id: "s-tet",
      name: "Sale Tết Đinh Mùi",
      badge: "Lì xì Tết",
      description: "Giảm 10% bộ sưu tập Xuân, tặng khăn vấn cho đơn bộ.",
      startAt: at(now, 58, 0),
      endAt: at(now, 78, 0),
      status: "DRAFT",
      discountType: "PERCENTAGE",
      value: 10,
      scope: "COLLECTIONS",
      scopeIds: ["col-xuan"],
      featuredOnHome: false,
      activity: activity(now, [["CREATED", 4, "Thu Hà", "Nháp — chờ chốt mẫu bộ sưu tập Xuân."]]),
      updatedAt: at(now, 0, 6),
    },
    {
      ...base,
      id: "s-sinh-nhat",
      name: "Sinh nhật tiệm 3 năm",
      nameEn: "Our 3rd birthday",
      badge: "Sinh nhật −25%",
      badgeEn: "Birthday −25%",
      startAt: at(now, -40, 0),
      endAt: at(now, -33, 0),
      status: "PUBLISHED",
      discountType: "PERCENTAGE",
      value: 25,
      scope: "ALL",
      scopeIds: [],
      excludedProductIds: ["p-10"],
      stats: stats(7, 7_800_000, 3, [["p-01", 11, 15_590_000], ["p-06", 9, 8_040_000], ["p-14", 14, 3_360_000]], 0.25),
      activity: activity(now, [["PUBLISHED", 1_000, "Thu Hà"], ["CREATED", 1_050, "Thu Hà"]]),
      updatedAt: at(now, -33, 0),
    },
    {
      ...base,
      id: "s-vu-lan",
      name: "Vu Lan — áo dài cho mẹ",
      nameEn: "Vu Lan — áo dài for Mum",
      badge: "Vu Lan",
      badgeEn: "Vu Lan",
      startAt: at(now, -86, 0),
      endAt: at(now, -76, 0),
      endedEarlyAt: at(now, -79, 12),
      status: "PUBLISHED",
      discountType: "FIXED_AMOUNT",
      value: 300_000,
      scope: "CATEGORIES",
      scopeIds: ["cat-truyen-thong", "cat-cach-tan"],
      stats: stats(6, 3_900_000, 4, [["p-02", 8, 9_200_000], ["p-11", 5, 6_950_000]], 0.18),
      activity: activity(now, [
        ["ENDED_EARLY", 79 * 24 - 12, "Thu Hà", "Hết lụa tơ tằm màu lam — dừng sớm để không nhận đơn không giao kịp."],
        ["PUBLISHED", 86 * 24 + 4, "Thu Hà"],
      ]),
      updatedAt: at(now, -79, 12),
    },
  ];
}

export function getMockSaleEventsBoard(): SaleEventsBoardData {
  const now = Date.now();
  return { ...buildCatalog(), events: buildEvents(now), now: new Date(now).toISOString() };
}

/**
 * `id` null = tạo mới (`fromId` = nhân bản từ chương trình đó: giữ phạm vi, mức giảm, giá đặt tay; bỏ thời gian,
 * số liệu, số đã bán); id không có trong mock → null (trang trả 404)
 */
export function getMockSaleEventEditor(id: string | null, fromId?: string | null): SaleEventEditorData | null {
  const now = Date.now();
  const events = buildEvents(now);
  const event = id ? (events.find((item) => item.id === id) ?? null) : null;
  if (id && !event) return null;
  const source = !id && fromId ? events.find((item) => item.id === fromId) : undefined;
  const template: AdminSaleEvent | null = source
    ? {
        ...source,
        id: "",
        name: `${source.name} (bản sao)`,
        status: "DRAFT",
        startAt: at(now, 1, 0),
        endAt: at(now, 8, 0),
        endedEarlyAt: null,
        featuredOnHome: false,
        stats: null,
        activity: [],
        productRules: Object.fromEntries(Object.entries(source.productRules).map(([key, rule]) => [key, { ...rule, sold: 0 }])),
      }
    : null;
  return { ...buildCatalog(), event, template, others: events.filter((item) => item.id !== id), now: new Date(now).toISOString() };
}
