import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../../shared/middlewares/authGuard'
import { validate } from '../../shared/middlewares/validate'
import { uploadSingleImage } from './upload.controller'
import { uploadQuerySchema } from './upload.schema'
import { AppError } from '../../shared/middlewares/errorHandler'

const router = Router()

// Multer storage configuration (in-memory)
const storage = multer.memoryStorage()

// File filter to restrict uploads to images only
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true)
  } else {
    callback(new AppError(400, 'ONLY_IMAGE_FILES_ALLOWED') as any)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: Upload Single Image
 *     description: Uploads an image to Cloudinary (Max 5MB). Requires customer or admin authentication.
 *     tags:
 *       - Upload
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           enum: [avatars, products, general, reviews]
 *           default: general
 *         description: Target Cloudinary folder name
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: UPLOAD_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/.../image.jpg"
 *                     publicId:
 *                       type: string
 *                       example: "general/xyz123"
 *       400:
 *         description: Bad request (IMAGE_FILE_REQUIRED or ONLY_IMAGE_FILES_ALLOWED)
 *       401:
 *         description: Unauthorized (AUTHENTICATION_TOKEN_REQUIRED)
 */
router.post(
  '/',
  requireAuth as any,
  validate(uploadQuerySchema),
  upload.single('image'),
  uploadSingleImage
)

export default router
