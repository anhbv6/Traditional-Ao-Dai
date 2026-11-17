import { MAX_IMAGE_BYTES } from "@repo/shared";

const MAX_SIDE = 2400;
const WEBP_QUALITY = 0.85;

export type CompressedImage = { success: true; file: File } | { success: false; error: string };

/**
 * Nén và thu nhỏ ảnh trên trình duyệt trước khi tải lên Cloudinary:
 * - Giới hạn kích thước file: tối đa MAX_IMAGE_BYTES (5MB).
 * - Thu nhỏ cạnh dài về tối đa 2400px giữ nguyên tỉ lệ gốc.
 * - Nén sang định dạng WebP chất lượng 85%.
 */
export async function compressClientImage(file: File): Promise<CompressedImage> {
  if (file.size > MAX_IMAGE_BYTES) return { success: false, error: "FILE_TOO_LARGE" };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { success: false, error: "ONLY_IMAGE_FILES_ALLOWED" };
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
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
