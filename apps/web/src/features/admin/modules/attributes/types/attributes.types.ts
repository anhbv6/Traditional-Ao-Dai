import { type AttributeGroup, type ColorFamily } from "../utils/attributeMeta";

export interface AdminAttributeValue {
  id: string;
  group: AttributeGroup;
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  hex: string | null;
  family: ColorFamily | null;
  isActive: boolean;
  position: number;
  /** Số SKU đang dùng (chỉ màu và size — khớp theo tên màu / ký hiệu size của biến thể); null với nhóm khác */
  skuCount: number | null;
}
