import { ClipboardCheck, PackagePlus, Scissors, Trash, type LucideIcon } from "lucide-react";
import { type FabricMovementType } from "../types/fabrics.types";

/** Icon cho từng loại biến động — dùng chung ở menu ⋯, dialog ghi biến động và lịch sử */
export const MOVEMENT_ICONS: Record<FabricMovementType, LucideIcon> = {
  CUT: Scissors,
  RESTOCK: PackagePlus,
  WASTE: Trash,
  ADJUST: ClipboardCheck,
};
