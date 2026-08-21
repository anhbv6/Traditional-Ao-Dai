import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../shared/middlewares/authGuard';
import { uploadSingleImage } from './upload.controller';

const router = Router();

// Multer storage configuration
const storage = multer.memoryStorage();

// File filter to restrict uploads to images only
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  } else {
    callback(new Error('ONLY_IMAGE_FILES_ALLOWED'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// POST /api/upload - Requires login to upload image
router.post('/', requireAuth as any, upload.single('image'), uploadSingleImage);

export default router;
