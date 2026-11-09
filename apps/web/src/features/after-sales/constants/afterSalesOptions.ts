/** Các loại yêu cầu hậu mãi khách gửi được sau khi nhận áo */
export const AFTER_SALES_SERVICES = ["ALTERATION", "EXCHANGE", "RETURN", "WARRANTY"] as const;
export type AfterSalesService = (typeof AFTER_SALES_SERVICES)[number];

/** Lý do theo từng loại yêu cầu — nhãn dịch ở `AfterSalesPage.reasons.<mã>` */
export const AFTER_SALES_REASONS = {
  ALTERATION: ["TOO_LOOSE", "TOO_TIGHT", "LENGTH", "SLEEVE", "OTHER"],
  EXCHANGE: ["WRONG_SIZE", "CHANGE_COLOR", "CHANGE_STYLE", "OTHER"],
  RETURN: ["NOT_AS_DESCRIBED", "WRONG_ITEM", "CHANGED_MIND", "OTHER"],
  WARRANTY: ["SEAM", "BUTTON_ZIP", "EMBROIDERY", "FABRIC_DEFECT", "OTHER"],
} as const satisfies Record<AfterSalesService, readonly string[]>;

/** Cách giao áo cho tiệm: mang tới showroom hoặc gửi bưu điện */
export const HANDOVER_METHODS = ["STORE", "POST"] as const;
export type HandoverMethod = (typeof HANDOVER_METHODS)[number];

/** Hạn áp dụng (ngày kể từ khi nhận hàng) — hiển thị ở bảng chính sách, tiệm đối chiếu khi tiếp nhận */
export const AFTER_SALES_WINDOWS: Record<AfterSalesService, number> = {
  ALTERATION: 30,
  EXCHANGE: 7,
  RETURN: 7,
  WARRANTY: 180,
};

/** Các bước xử lý yêu cầu — nhãn ở `AfterSalesPage.process.steps.<mã>` */
export const AFTER_SALES_PROCESS_STEPS = ["SUBMIT", "CONFIRM", "HANDOVER", "DONE"] as const;

export const AFTER_SALES_DESCRIPTION_MAX = 1000;
export const AFTER_SALES_MAX_PHOTOS = 5;
