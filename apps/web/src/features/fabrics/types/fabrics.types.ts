import type { PublicMaterialDto } from "@repo/shared/materials";

/** Một tấm vải trong album — dữ liệu công khai từ GET /api/materials */
export type FabricMaterial = PublicMaterialDto;

/** Bộ lọc album: tất cả / theo mùa / theo sợi chính */
export type FabricFilter = { kind: "all" } | { kind: "season"; value: FabricMaterial["seasons"][number] } | { kind: "fiber"; value: FabricMaterial["composition"][number]["fiber"] };
