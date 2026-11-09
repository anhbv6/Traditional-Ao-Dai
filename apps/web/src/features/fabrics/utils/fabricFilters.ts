import { FIBERS, SEASONS, type Fiber, type Season } from "@repo/shared/materials";
import type { FabricFilter, FabricMaterial } from "../types/fabrics.types";

/** Sợi chính = phần trăm lớn nhất trong thành phần */
export function mainFiber(material: FabricMaterial): Fiber | undefined {
  return [...material.composition].sort((a, b) => b.percent - a.percent)[0]?.fiber;
}

/** Chỉ đưa ra bộ lọc có ít nhất một tấm vải khớp (giữ thứ tự cố định của hằng số) */
export function availableFilters(materials: FabricMaterial[]): { seasons: Season[]; fibers: Fiber[] } {
  const seasons = new Set(materials.flatMap((m) => m.seasons));
  const fibers = new Set(materials.flatMap((m) => m.composition.map((c) => c.fiber)));
  return {
    seasons: SEASONS.filter((s) => seasons.has(s)),
    fibers: FIBERS.filter((f) => fibers.has(f)),
  };
}

export function matchesFilter(material: FabricMaterial, filter: FabricFilter): boolean {
  if (filter.kind === "season") return material.seasons.includes(filter.value);
  if (filter.kind === "fiber") return material.composition.some((c) => c.fiber === filter.value);
  return true;
}

export function isSameFilter(a: FabricFilter, b: FabricFilter): boolean {
  if (a.kind === "all" || b.kind === "all") return a.kind === b.kind;
  return a.kind === b.kind && a.value === b.value;
}
