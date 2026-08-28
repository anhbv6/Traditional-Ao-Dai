import { Request, Response, NextFunction } from 'express'
import * as uploadService from './upload.service'
import { sendSuccess } from '../../shared/utils/response'

/**
 * Controller handler for uploading a single image
 */
export async function uploadSingleImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const folder = (req.query.folder as string) || 'general'
    const result = await uploadService.uploadImage(req.file, folder)

    return sendSuccess(res, {
      statusCode: 200,
      message: 'UPLOAD_SUCCESS',
      data: result,
    })
  } catch (error) {
    return next(error)
  }
}
