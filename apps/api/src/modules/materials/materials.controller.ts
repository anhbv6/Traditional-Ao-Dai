import { type Request, type Response, type NextFunction } from 'express'
import * as service from './materials.service'
import { sendSuccess } from '../../core/http/response'
import { type ListMaterialsQuery } from './materials.schema'

export async function listMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { locale } = req.query as unknown as ListMaterialsQuery
    const data = await service.listPublicMaterials(locale)
    return sendSuccess(res, { data, message: 'MATERIALS_FOUND' })
  } catch (error) {
    return next(error)
  }
}
