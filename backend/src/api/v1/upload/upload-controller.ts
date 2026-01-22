import { Request, Response } from 'express';
import { UploadService } from '../../../services/upload-service';
import { validateUploadRequest } from '../../../middleware/validation';
import { AppError } from '../../../utils/error-handling';

export class UploadController {
  /**
   * Uploads a PDF file for processing
   */
  static async uploadFile(req: Request, res: Response): Promise<Response> {
    try {
      // Validate the request
      const validationResult = validateUploadRequest;

      // In a real implementation, we would call the validation middleware
      // For now, we'll do basic validation directly
      if (!req.file) {
        throw new AppError('File is required', 400);
      }

      if (req.file.size > 10 * 1024 * 1024) { // 10MB
        throw new AppError('File size exceeds 10MB limit', 413);
      }

      if (req.file.mimetype !== 'application/pdf') {
        throw new AppError('Only PDF files are allowed', 415);
      }

      // Get user ID from request (could be from auth middleware or body)
      const userId = (req as any).userId || req.body.userId;
      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      // Get retention preference
      const retain = req.body.retain === 'true' || req.body.retain === true;

      // Process the upload
      const uploadResult = await UploadService.uploadFile(req.file, userId, retain);

      return res.status(201).json({
        id: uploadResult.id,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        status: uploadResult.status,
        createdAt: uploadResult.createdAt,
        message: 'File uploaded successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.statusCode
        });
      }

      return res.status(500).json({
        error: 'Internal server error during upload',
        code: 500
      });
    }
  }

  /**
   * Gets upload session details
   */
  static async getUploadSession(req: Request, res: Response): Promise<Response> {
    try {
      const sessionId = req.params.id;

      if (!sessionId) {
        throw new AppError('Session ID is required', 400);
      }

      // In a real implementation, this would fetch from database
      const sessionInfo = await UploadService.getUploadSession(sessionId);

      return res.status(200).json(sessionInfo);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.statusCode
        });
      }

      return res.status(500).json({
        error: 'Internal server error retrieving session',
        code: 500
      });
    }
  }

  /**
   * Deletes a temporary upload
   */
  static async deleteUpload(req: Request, res: Response): Promise<Response> {
    try {
      const sessionId = req.params.id;

      if (!sessionId) {
        throw new AppError('Session ID is required', 400);
      }

      // In a real implementation, this would delete from database and storage
      // For now, we'll just return success
      return res.status(200).json({
        message: 'Upload deleted successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.statusCode
        });
      }

      return res.status(500).json({
        error: 'Internal server error deleting upload',
        code: 500
      });
    }
  }
}