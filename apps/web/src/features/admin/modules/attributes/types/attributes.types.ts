import { type ColorFamily } from "../utils/attributeMeta";

/** Nhóm thuộc tính (thuộc tính cha) — nhóm hệ thống không xóa được, nhóm admin thêm luôn là đặc tính thiết kế */
export interface AdminAttributeGroup {
  id: string;
  /** Mã ổn định: COLOR, SIZE, NECKLINE... hoặc mã admin đặt cho nhóm mới */
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  isSystem: boolean;
  position: number;
  valueCount: number;
}

export interface AdminAttributeValue {
  id: string;
  groupId: string;
  /** Mã nhóm (COLOR, SIZE, NECKLINE...) — màu / size có hành vi riêng */
  group: string;
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

/** Dữ liệu màn thuộc tính: nhóm (theo thứ tự) + mọi giá trị */
export interface AdminAttributeData {
  groups: AdminAttributeGroup[];
  values: AdminAttributeValue[];
}
