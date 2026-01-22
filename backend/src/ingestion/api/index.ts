import { Router } from 'express';
import { uploadDocument, getDocumentStatus } from './upload_controller';

// Create router
const router = Router();

// Document upload endpoint
router.post('/documents', uploadDocument);

// Document status endpoint
router.get('/documents/:documentId', getDocumentStatus);

export { router };