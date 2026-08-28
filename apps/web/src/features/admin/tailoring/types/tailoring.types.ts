export type TailoringStatus =
  | "NOT_APPLICABLE"
  | "WAITING_FABRIC"
  | "FABRIC_CUTTING"
  | "SEWING"
  | "EMBROIDERY_BEADING"
  | "FITTING_IRONING"
  | "COMPLETED";

export interface TailoringItemData {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productImage?: string | null;
  tailoringStatus: TailoringStatus;
  // Số đo
  height?: number | null;
  weight?: number | null;
  bust?: number | null;
  waist?: number | null;
  hips?: number | null;
  shoulder?: number | null;
  armLength?: number | null;
  armpit?: number | null;
  neck?: number | null;
  shirtLength?: number | null;
  pantsLength?: number | null;
  thigh?: number | null;
  customNote?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  latestLog?: {
    status: TailoringStatus;
    note?: string | null;
    staffName?: string | null;
    createdAt: Date | string;
  } | null;
}
