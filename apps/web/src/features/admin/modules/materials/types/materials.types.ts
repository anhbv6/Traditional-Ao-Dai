import { type CareCode, type Fiber, type MaterialMetric, type Season } from "../utils/materialMeta";

export interface CompositionItem {
  fiber: Fiber;
  percent: number;
}

export interface ProcessStep {
  title: string;
  titleEn: string;
  detail: string;
  detailEn: string;
}

export type MaterialMetrics = Record<MaterialMetric, number | null>;

/** Cây vải trong kho thuộc chất liệu (chỉ đọc ở màn chất liệu) */
export interface MaterialFabricRoll {
  id: string;
  code: string;
  name: string;
  color: string | null;
  remainingMeters: number;
  isLow: boolean;
}

export interface AdminMaterialListItem {
  id: string;
  code: string;
  name: string;
  origin: string | null;
  cover: string | null;
  composition: CompositionItem[];
  metrics: MaterialMetrics;
  seasons: Season[];
  metersPerTop: number | null;
  isActive: boolean;
  rollCount: number;
  remainingMeters: number;
  /** Số thân áo còn may được từ kho; null khi chưa có định mức */
  topsAvailable: number | null;
}

export interface AdminMaterialDetail {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  origin: string | null;
  originEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  composition: CompositionItem[];
  processSteps: ProcessStep[];
  closeupImages: string[];
  videoUrl: string | null;
  metrics: MaterialMetrics;
  seasons: Season[];
  careCodes: CareCode[];
  careNote: string | null;
  careNoteEn: string | null;
  widthCm: number | null;
  metersPerTop: number | null;
  metersPerPants: number | null;
  isActive: boolean;
  rolls: MaterialFabricRoll[];
  updatedAt: string;
}
