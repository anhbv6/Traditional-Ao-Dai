import { MAX_IMAGE_BYTES } from "@repo/shared";
import { uploadImageApi } from "@/features/upload";

/** Tỉ lệ chuẩn của ảnh sản phẩm Áo dài Thiên Canh (3:4) */
const TARGET_RATIO = 3 / 4;

/** Độ phân giải tối đa cho chiều cao (2560px - chuẩn 2K HD) để đảm bảo độ sắc nét trên màn hình Retina / 4K */
const MAX_HEIGHT = 2560;

/** Chất lượng nén WebP HD (0.90) cho độ chi tiết sợi vải, hoa văn thêu tinh xảo */
const WEBP_QUALITY = 0.90;

export type PreparedImage = { success: true; file: File } | { success: false; error: string };

/**
 * Tự động căn chỉnh và cắt ảnh thông minh theo tỉ lệ chuẩn 3:4, giữ nguyên chất lượng HD:
 * - Nếu ảnh rộng hơn 3:4 (vuông hoặc ngang): giữ nguyên 100% chiều cao, cắt đều 2 bên mép để giữ mẫu ở giữa.
 * - Nếu ảnh dài hơn 3:4 (ảnh dọc 9:16): giữ nguyên 100% chiều rộng, cắt chiều cao với trọng tâm 25% phía trên để giữ trọn đầu, cổ và dáng áo dài.
 * - Giữ nguyên độ phân giải gốc của ảnh (tối đa 2560px HD), xuất ra định dạng WebP chất lượng cao 90%.
 */
export async function prepareAndCropProductImage(file: File): Promise<PreparedImage> {
  if (file.size > MAX_IMAGE_BYTES) return { success: false, error: "FILE_TOO_LARGE" };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { success: false, error: "ONLY_IMAGE_FILES_ALLOWED" };
  }

  const currentRatio = bitmap.width / bitmap.height;
  let cropX = 0;
  let cropY = 0;
  let cropW = bitmap.width;
  let cropH = bitmap.height;

  // Nếu tỉ lệ lệch so với chuẩn 3:4 quá 0.5%, tự động crop tối ưu
  if (Math.abs(currentRatio - TARGET_RATIO) > 0.005) {
    if (currentRatio > TARGET_RATIO) {
      // Ảnh rộng hơn 3:4 (ngang hoặc vuông): giữ trọn vẹn chiều cao, cắt bỏ phần thừa hai bên
      cropH = bitmap.height;
      cropW = Math.round(cropH * TARGET_RATIO);
      cropX = Math.round((bitmap.width - cropW) / 2);
      cropY = 0;
    } else {
      // Ảnh dài hơn 3:4 (ảnh 9:16 trên điện thoại): giữ trọn vẹn chiều rộng, cắt bớt chiều cao
      // Cắt với trọng tâm 25% phía trên để không làm mất đỉnh đầu người mẫu hoặc cổ áo
      cropW = bitmap.width;
      cropH = Math.round(cropW / TARGET_RATIO);
      cropX = 0;
      cropY = Math.max(0, Math.round((bitmap.height - cropH) * 0.25));
    }
  }

  // Tỷ lệ scale giữ nguyên chất lượng HD (tối đa MAX_HEIGHT)
  const scale = Math.min(1, MAX_HEIGHT / cropH);
  const outW = Math.round(cropW * scale);
  const outH = Math.round(cropH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { success: false, error: "IMAGE_PROCESS_FAILED" };
  }

  // Bật chế độ nội suy chất lượng cao nhất của trình duyệt
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
  if (!blob) return { success: false, error: "IMAGE_PROCESS_FAILED" };

  const name = file.name.replace(/\.[^.]+$/, "") || "product";
  return { success: true, file: new File([blob], `${name}.webp`, { type: "image/webp" }) };
}

/** Tương thích ngược với tên hàm cũ */
export const prepareProductImage = prepareAndCropProductImage;

/* ============================================================================
 * QUẢN LÝ ẢNH NHÁP (DRAFT IMAGES)
 * Chỉ lưu trữ tạm dưới client (blob URL). Chỉ upload lên Cloudinary khi ấn "Lưu" thật sự.
 * ========================================================================== */

const draftImages = new Map<string, File>();

/** Đăng ký file nháp và sinh URL preview tạm thời */
export function registerDraftProductImage(file: File): string {
  const blobUrl = URL.createObjectURL(file);
  draftImages.set(blobUrl, file);
  return blobUrl;
}

/** Kiểm tra xem URL có phải là ảnh nháp chưa lưu hay không */
export function isDraftProductImage(url: string): boolean {
  return draftImages.has(url) || url.startsWith("blob:");
}

/** Lấy File của ảnh nháp nếu có */
export function getDraftProductFile(url: string): File | undefined {
  return draftImages.get(url);
}

/** Thu hồi blob URL và gỡ khỏi danh sách nháp */
export function revokeDraftProductImage(url: string): void {
  draftImages.delete(url);
  if (typeof window !== "undefined" && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // bỏ qua
    }
  }
}

/**
 * Tải toàn bộ các ảnh nháp trong mảng lên Cloudinary thật sự và trả về mảng URL hoàn chỉnh.
 * Chỉ gọi hàm này khi người dùng ấn nút "Lưu thay đổi" (Save).
 */
export async function uploadPendingProductImages(
  imageUrls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const pendingCount = imageUrls.filter((url) => draftImages.has(url)).length;
  let uploadedCount = 0;

  const results: string[] = [];
  for (const url of imageUrls) {
    const draftFile = draftImages.get(url);
    if (draftFile) {
      const res = await uploadImageApi(draftFile, "products");
      results.push(res.data.url);
      revokeDraftProductImage(url);
      uploadedCount += 1;
      onProgress?.(uploadedCount, pendingCount);
    } else {
      results.push(url);
    }
  }

  return results;
}

/** Xóa và thu hồi toàn bộ ảnh nháp còn lại khi đóng trang hoặc hủy chỉnh sửa */
export function clearDraftProductImages(): void {
  for (const url of draftImages.keys()) {
    if (url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // bỏ qua
      }
    }
  }
  draftImages.clear();
}
