import express from 'express';
import { ParseController } from './parse-controller';
import { authenticateToken } from '../../../middleware/auth';
import { uploadMiddleware } from '../../../middleware/upload';

const router = express.Router();

// Parse invoice from uploaded file
router.get('/:id',
  authenticateToken,
  ParseController.parseInvoice
);

// Parse invoice from raw PDF upload
router.post('/',
  authenticateToken,
  uploadMiddleware.single('file'),
  ParseController.parseInvoiceFromRaw
);

// Get processing results
router.get('/results/:id',
  authenticateToken,
  ParseController.getResults
);

export { router as parseRouter };