import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage-service';
import { EncryptionUtil } from '../utils/encryption';
import { UploadSessionModel, InvoiceModel } from '../models/invoice';
import { validateFile } from '../middleware/upload';

export interface UploadResult {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

export class UploadService {
  /**
   * Uploads a file and stores it securely
   */
  static async uploadFile(
    file: Express.Multer.File,
    userId: string,
    retain: boolean = false
  ): Promise<UploadResult> {
    try {
      // Validate the file
      const validation = validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error || 'File validation failed');
      }

      // Create upload session
      const sessionId = uuidv4();
      const uploadSession = UploadSessionModel.create(userId, sessionId);

      // Prepare encryption key
      let encryptionKey: string | undefined;
      if (retain) {
        // Generate a unique encryption key for retained files
        encryptionKey = EncryptionUtil.generateRandomString(32);
      }

      // Store the file securely
      const fileInfo = await StorageService.storeFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        encryptionKey ? { algorithm: 'aes-256-cbc', key: encryptionKey } : undefined
      );

      // Create an invoice record
      const invoice = InvoiceModel.create(
        userId,
        file.originalname,
        file.size,
        file.mimetype,
        fileInfo.storedPath
      );

      // Return upload result
      return {
        id: uploadSession.sessionId,
        fileName: file.originalname,
        fileSize: file.size,
        status: invoice.status,
        createdAt: invoice.createdAt
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Validates a file before upload
   */
  static validateFileForUpload(file: Express.Multer.File): FileValidationResult {
    const errors: string[] = [];

    // Check if file exists
    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size exceeds 10MB limit');
    }

    // Check file type
    if (file.mimetype !== 'application/pdf') {
      errors.push('Invalid file type. Only PDF files are allowed.');
    }

    // Check file extension
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    if (fileExtension !== 'pdf') {
      errors.push('Invalid file extension. Only .pdf files are allowed.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets upload session details
   */
  static async getUploadSession(sessionId: string): Promise<any> {
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate retrieving session info
    return {
      id: sessionId,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };
  }

  /**
   * Cleans up temporary files older than the expiration time
   */
  static async cleanupTemporaryFiles(): Promise<number> {
    return await StorageService.cleanupExpiredFiles();
  }
}