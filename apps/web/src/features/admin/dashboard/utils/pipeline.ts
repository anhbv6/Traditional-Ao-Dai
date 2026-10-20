import { ADMIN_ACTION_ACCESS, type AdminAccessRule } from "../../session/permissions";
import { type PipelineStage } from "../types/dashboard.types";

/**
 * Quyền cần có để chuyển đơn VÀO từng cột Kanban — dùng chung cho Server Action và ẩn/hiện nút trên UI.
 * Duyệt đơn / giao hàng là việc của bộ phận đơn hàng; các công đoạn giữa là việc của xưởng may.
 */
export const PIPELINE_STAGE_PERMISSION: Record<PipelineStage, AdminAccessRule> = {
  review: ADMIN_ACTION_ACCESS.manageOrders,
  cutting: ADMIN_ACTION_ACCESS.manageOrders,
  sewing: ADMIN_ACTION_ACCESS.updateTailoring,
  fitting: ADMIN_ACTION_ACCESS.updateTailoring,
  delivery: ADMIN_ACTION_ACCESS.manageOrders,
};
