import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../../services/document_service';
import { DocumentModel } from '../../models/document';
import { UploadSessionModel } from '../../models/upload_session';
import { upload, validateFile, validateFileIntegrity, documentUploadRateLimit } from '../middleware/file_validation';
import { authenticate, oauth2Authenticate, jwtAuthenticate } from '../middleware/auth';

// Initialize services
const documentService = new DocumentService();
const documentModel = new DocumentModel();
const uploadSessionModel = new UploadSessionModel();

// Upload controller
export const uploadDocument = [
  // Apply rate limiting
  documentUploadRateLimit,

  // Authenticate request
  authenticate,

  // Handle file upload with multer
  upload.single('file'),

  // Validate file
  validateFile,

  // Validate file integrity
  validateFileIntegrity,

  // Process the upload
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      // Get file information
      const { originalname, mimetype, size, path: filePath } = req.file;

      // Get user information from authentication
      const userId = (req as any).user?.id;

      // Create document
      const document = await documentService.createDocument(
        originalname,
        mimetype,
        size,
        userId,
        filePath
      );

      // Create upload session
      const uploadSession = await documentService.createUploadSession(
        originalname,
        filePath,
        size,
        userId
      );

      // Log the API request
      console.log(`Document uploaded: ${document.documentId} by user: ${userId}`);

      // Return success response
      return res.status(201).json({
        documentId: document.documentId,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadTimestamp: document.uploadTimestamp,
        processingStatus: document.processingStatus
      });

    } catch (error) {
      console.error('Error uploading document:', error);

      // Return error response
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to upload document'
      });
    }
  }
];

// Get document status endpoint
export const getDocumentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.params;

    // Validate document ID
    if (!documentId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Document ID is required'
      });
    }

    // Get document from database
    const document = await documentModel.getById(documentId);

    if (!document) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found'
      });
    }

    // Return document status
    return res.status(200).json({
      documentId: document.documentId,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      uploadTimestamp: document.uploadTimestamp,
      processingStatus: document.processingStatus,
      userId: document.userId,
      checksum: document.checksum
    });

  } catch (error) {
    console.error('Error getting document status:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve document status'
    });
  }
};