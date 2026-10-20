import { type AppointmentType, type TailoringStatus } from "@repo/db";

/* ============================================================================
 * A. THẺ CHỈ SỐ VẬN HÀNH
 * ========================================================================== */

/** Đơn có ngày hẹn trả trong vòng số ngày này được coi là cần giao gấp */
export const URGENT_DAYS = 3;

export interface DashboardKpis {
  /** Doanh thu & công nợ cọc — chỉ có khi được xem báo cáo */
  finance: {
    /** Tiền đã thu (VND) của đơn tạo trong hôm nay / tháng này */
    receivedToday: number;
    receivedMonth: number;
    /** Tiền khách còn nợ ở các đơn đã cọc, chưa giao */
    outstanding: number;
    outstandingOrders: number;
  } | null;
  /** Số áo đang trên bàn may theo công đoạn */
  tailoring: {
    waitingCut: number;
    sewing: number;
    embroidery: number;
  } | null;
  /** Đơn chưa giao có ngày hẹn trả trong URGENT_DAYS ngày tới / đã quá hạn */
  urgent: {
    dueSoon: number;
    overdue: number;
  } | null;
  /** Lịch hẹn tại tiệm hôm nay (chưa huỷ) */
  appointments: {
    total: number;
    measurement: number;
    fitting: number;
  } | null;
}

/* ============================================================================
 * B. BẢNG ĐIỀU PHỐI TIẾN ĐỘ MAY
 * ========================================================================== */

/** 5 cột Kanban theo thứ tự xử lý */
export const PIPELINE_STAGES = ["review", "cutting", "sewing", "fitting", "delivery"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface PipelineCard {
  orderId: string;
  orderNumber: string;
  customerName: string;
  /** Số ngày lịch (giờ VN) còn lại tới hạn trả lúc tải dữ liệu: 0 = hôm nay, âm = đã trễ; null = chưa hẹn ngày */
  daysLeft: number | null;
  totalAmount: number;
  paidAmount: number;
  productNames: string[];
  /** Công đoạn chậm nhất trong các áo may đo của đơn (để hiện chi tiết ở cột "Đang may") */
  tailoringStatus: TailoringStatus;
  stage: PipelineStage;
}

/* ============================================================================
 * C. LỊCH HẸN & KHO VẢI
 * ========================================================================== */

export interface MeasurementSnapshot {
  /** Tên hồ sơ số đo (khách có tài khoản) hoặc mã đơn (số đo lưu trên đơn) */
  source: string;
  height: number | null;
  weight: number | null;
  bust: number | null;
  waist: number | null;
  hips: number | null;
  shoulder: number | null;
  armLength: number | null;
  shirtLength: number | null;
  pantsLength: number | null;
  note: string | null;
}

export interface TodayAppointment {
  id: string;
  /** ISO string */
  scheduledAt: string;
  /** Giờ hẹn đã qua (lúc tải dữ liệu) */
  isPast: boolean;
  customerName: string;
  customerPhone: string | null;
  type: AppointmentType;
  note: string | null;
  orderNumber: string | null;
  measurement: MeasurementSnapshot | null;
}

export interface LowFabric {
  id: string;
  code: string;
  name: string;
  color: string | null;
  remainingMeters: number;
  threshold: number;
  product: { id: string; name: string; isActive: boolean } | null;
}
