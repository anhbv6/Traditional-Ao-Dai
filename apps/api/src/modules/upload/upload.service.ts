import { isProductImageRatio } from '@repo/shared'
import { deleteFromCloudinary, uploadToCloudinary } from '../../infra/cloudinary'
import { AppError } from '../../core/http/AppError'

export interface UploadResult {
  url: string
  publicId: string
}

/**
 * Upload single image to Cloudinary.
 * Ảnh sản phẩm luôn lưu WebP và phải dọc 3:4 hoặc 9:16 — kiểm tra lại ở đây vì client có thể bị bỏ qua.
 */
export async function uploadImage(
  file?: Express.Multer.File,
  folder: string = 'general'
): Promise<UploadResult> {
  if (!file || !file.buffer) {
    throw new AppError(400, 'IMAGE_FILE_REQUIRED')
  }

  const isProductImage = folder === 'products'
  const result = await uploadToCloudinary(file.buffer, folder, isProductImage ? 'webp' : undefined)

  if (isProductImage && !isProductImageRatio(result.width, result.height)) {
    await deleteFromCloudinary(result.public_id)
    throw new AppError(400, 'IMAGE_RATIO_INVALID')
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}
