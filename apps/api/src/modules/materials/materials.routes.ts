import { Router } from 'express'
import * as controller from './materials.controller'
import { validate } from '../../core/middlewares/validate'
import { rateLimit } from '../../core/middlewares/rateLimit'
import { listMaterialsSchema } from './materials.schema'

const router = Router()

/**
 * @openapi
 * /api/materials:
 *   get:
 *     summary: Thư mục vải (công khai)
 *     description: |
 *       Danh sách chất liệu vải đang dùng của tiệm, sắp theo thứ tự admin đặt. Nội dung chọn theo `locale`
 *       (thiếu bản tiếng Anh thì rơi về tiếng Việt). Tồn kho chỉ trả tình trạng AVAILABLE / LIMITED / ON_REQUEST
 *       và các màu cây vải đang có — không trả số mét.
 *     tags: [Materials]
 *     parameters:
 *       - in: query
 *         name: locale
 *         schema: { type: string, enum: [vi, en], default: vi }
 *     responses:
 *       200:
 *         description: MATERIALS_FOUND — data là mảng chất liệu
 *       400:
 *         description: VALIDATION_ERROR
 *       429:
 *         description: TOO_MANY_REQUESTS
 */
router.get('/', validate(listMaterialsSchema), rateLimit({ name: 'materials-list-ip', max: 120, windowSec: 60 }), controller.listMaterials)

export default router
