import { uploadToCloudinary } from '../../shared/utils/cloudinary'
import { AppError } from '../../shared/middlewares/errorHandler'

export interface UploadResult {
  url: string
  publicId: string
}

/**
 * Upload single image to Cloudinary
 */
export async function uploadImage(
  file?: Express.Multer.File,
  folder: string = 'general'
): Promise<UploadResult> {
  if (!file || !file.buffer) {
    throw new AppError(400, 'IMAGE_FILE_REQUIRED')
  }

  const result = await uploadToCloudinary(file.buffer, folder)

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}
