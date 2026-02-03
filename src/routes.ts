import { Application } from 'express';
import { uploadDocument, getDocumentStatus } from './ingestion/api/upload_controller';
import { rateLimiter } from './middleware/security';

export const setupRoutes = (app: Application) => {
  // Document upload endpoint with rate limiting
  app.post('/v1/documents', rateLimiter, uploadDocument);

  // Document status endpoint
  app.get('/v1/documents/:documentId', getDocumentStatus);
};