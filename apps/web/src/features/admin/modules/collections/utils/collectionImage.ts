import { MAX_IMAGE_BYTES } from "@repo/shared";

const MAX_SIDE = 2400;
const WEBP_QUALITY = 0.85;

export type CompressedImage = { success: true; file: File } | { success: false; error: string };

/**
 * Ảnh bộ sưu tập (bìa, banner, lookbook): giới hạn 5MB, thu nhỏ cạnh dài và nén WebP trên trình duyệt.
 * Không ép tỉ lệ như ảnh sản phẩm vì banner là ảnh ngang. Trình duyệt không mã hóa được WebP thì gửi ảnh gốc.
 */
export async function compressCollectionImage(file: File): Promise<CompressedImage> {
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
