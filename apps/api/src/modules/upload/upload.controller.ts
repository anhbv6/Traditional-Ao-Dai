import { Request, Response, NextFunction } from 'express';
import { uploadToCloudinary } from '../../shared/utils/cloudinary';

export const uploadSingleImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'IMAGE_FILE_REQUIRED',
      });
    }

    // Determine target folder based on request query or default to 'general'
    const folder = (req.query.folder as string) || 'general';

    // Upload to Cloudinary using the utility
    const result = await uploadToCloudinary(req.file.buffer, folder);

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    next(error);
  }
};
