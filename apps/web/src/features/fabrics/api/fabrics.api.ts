import type { ApiSuccess, Locale } from "@repo/shared";
import { apiClient } from "@/lib/api-client";
import type { FabricMaterial } from "../types/fabrics.types";

/** Thư mục vải được admin cập nhật thưa — cache 5 phút ở server Next.js để giảm gọi Express */
const FABRIC_LIBRARY_REVALIDATE_SECONDS = 300;

/**
 * Lấy thư mục vải (gọi ở Server Component cho SEO). Trả `null` khi API lỗi để trang hiện trạng thái tạm vắng.
 */
export async function fetchFabricLibrary(locale: Locale): Promise<FabricMaterial[] | null> {
  try {
    const res = await apiClient.get<ApiSuccess<FabricMaterial[]>>("/api/materials", {
      params: { locale },
      skipAuth: true,
      next: { revalidate: FABRIC_LIBRARY_REVALIDATE_SECONDS },
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Lỗi fetchFabricLibrary:", error instanceof Error ? error.message : error);
    return null;
  }
}
