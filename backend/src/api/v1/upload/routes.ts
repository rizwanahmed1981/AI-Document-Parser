import express from 'express';
import { UploadController } from './upload-controller';
import { uploadMiddleware } from '../../../middleware/upload';
import { authenticateToken } from '../../../middleware/auth';

const router = express.Router();

// Upload endpoint - requires authentication
router.post('/',
  authenticateToken,
  uploadMiddleware.single('file'),
  UploadController.uploadFile
);

// Get upload session details
router.get('/:id',
  authenticateToken,
  UploadController.getUploadSession
);

// Delete upload (cleanup)
router.delete('/:id',
  authenticateToken,
  UploadController.deleteUpload
);

export { router as uploadRouter };