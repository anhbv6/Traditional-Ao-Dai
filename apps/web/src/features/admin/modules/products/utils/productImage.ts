import { isProductImageRatio, MAX_IMAGE_BYTES } from "@repo/shared";

const MAX_HEIGHT = 2000;
const WEBP_QUALITY = 0.85;

export type PreparedImage = { success: true; file: File } | { success: false; error: string };

/**
 * Kiểm tra dung lượng, tỉ lệ dọc rồi nén sang WebP ngay trên trình duyệt để phản hồi tức thì và tải lên nhẹ hơn.
 * Trình duyệt không mã hóa được WebP (Safari cũ) thì gửi ảnh gốc — API vẫn lưu WebP.
 */
export async function prepareProductImage(file: File): Promise<PreparedImage> {
  if (file.size > MAX_IMAGE_BYTES) return { success: false, error: "FILE_TOO_LARGE" };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { success: false, error: "ONLY_IMAGE_FILES_ALLOWED" };
  }

  if (!isProductImageRatio(bitmap.width, bitmap.height)) {
    bitmap.close();
    return { success: false, error: "IMAGE_RATIO_INVALID" };
  }

  const scale = Math.min(1, MAX_HEIGHT / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
  if (blob?.type !== "image/webp") return { success: true, file };

  const name = file.name.replace(/\.[^.]+$/, "") || "image";
  return { success: true, file: new File([blob], `${name}.webp`, { type: "image/webp" }) };
}
