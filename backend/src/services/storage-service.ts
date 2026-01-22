import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promises as fsPromises } from 'fs';

export interface StoredFileInfo {
  id: string;
  originalName: string;
  storedPath: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  expiresAt: Date;
}

export interface EncryptionOptions {
  algorithm: string;
  key: string;
}

export class StorageService {
  private static readonly DEFAULT_STORAGE_PATH = path.join(process.cwd(), 'storage', 'temp');
  private static readonly DEFAULT_EXPIRATION_HOURS = 24;

  /**
   * Stores a file with optional encryption
   */
  static async storeFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    encryptionOptions?: EncryptionOptions
  ): Promise<StoredFileInfo> {
    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.DEFAULT_STORAGE_PATH)) {
      await fsPromises.mkdir(this.DEFAULT_STORAGE_PATH, { recursive: true });
    }

    // Generate a unique ID for the file
    const fileId = crypto.randomUUID();

    // Create a unique filename
    const uniqueFileName = `${fileId}_${originalName}`;
    const filePath = path.join(this.DEFAULT_STORAGE_PATH, uniqueFileName);

    // Process the file (encrypt if needed)
    let processedBuffer = fileBuffer;
    if (encryptionOptions) {
      processedBuffer = this.encryptBuffer(fileBuffer, encryptionOptions);
    }

    // Write the file to storage
    await fsPromises.writeFile(filePath, processedBuffer);

    // Create expiration time (24 hours from now)
    const uploadedAt = new Date();
    const expiresAt = new Date(uploadedAt.getTime() + this.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000);

    const fileInfo: StoredFileInfo = {
      id: fileId,
      originalName,
      storedPath: filePath,
      size: fileBuffer.length,
      mimeType,
      uploadedAt,
      expiresAt
    };

    return fileInfo;
  }

  /**
   * Retrieves a stored file
   */
  static async retrieveFile(fileId: string, encryptionOptions?: EncryptionOptions): Promise<Buffer | null> {
    const filePath = path.join(this.DEFAULT_STORAGE_PATH, `${fileId}_*`);

    // Find the file with the matching ID prefix
    const files = fs.readdirSync(this.DEFAULT_STORAGE_PATH);
    const matchingFile = files.find(file => file.startsWith(`${fileId}_`));

    if (!matchingFile) {
      return null;
    }

    const fullPath = path.join(this.DEFAULT_STORAGE_PATH, matchingFile);

    // Read the file
    let fileBuffer = await fsPromises.readFile(fullPath);

    // Decrypt if needed
    if (encryptionOptions && fileBuffer.length > 0) {
      fileBuffer = this.decryptBuffer(fileBuffer, encryptionOptions);
    }

    return fileBuffer;
  }

  /**
   * Deletes a stored file
   */
  static async deleteFile(fileId: string): Promise<boolean> {
    const files = fs.readdirSync(this.DEFAULT_STORAGE_PATH);
    const matchingFile = files.find(file => file.startsWith(`${fileId}_`));

    if (!matchingFile) {
      return false;
    }

    const fullPath = path.join(this.DEFAULT_STORAGE_PATH, matchingFile);

    try {
      await fsPromises.unlink(fullPath);
      return true;
    } catch (error) {
      console.error(`Failed to delete file ${fullPath}:`, error);
      return false;
    }
  }

  /**
   * Cleans up expired files
   */
  static async cleanupExpiredFiles(): Promise<number> {
    const files = fs.readdirSync(this.DEFAULT_STORAGE_PATH);
    const now = new Date();
    let deletedCount = 0;

    for (const file of files) {
      // Extract file ID from filename (before the first underscore)
      const parts = file.split('_');
      if (parts.length < 2) continue;

      const fileId = parts[0];
      const fileInfo = await this.getFileInfo(fileId);

      if (fileInfo && fileInfo.expiresAt < now) {
        const deleted = await this.deleteFile(fileId);
        if (deleted) deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Gets information about a stored file
   */
  static async getFileInfo(fileId: string): Promise<StoredFileInfo | null> {
    const files = fs.readdirSync(this.DEFAULT_STORAGE_PATH);
    const matchingFile = files.find(file => file.startsWith(`${fileId}_`));

    if (!matchingFile) {
      return null;
    }

    const fullPath = path.join(this.DEFAULT_STORAGE_PATH, matchingFile);

    try {
      const stats = await fsPromises.stat(fullPath);
      // We need to reconstruct the original name from the stored filename
      const originalName = matchingFile.substring(fileId.length + 1); // Remove "fileId_" prefix

      // For this implementation, we'll need to store metadata separately to properly track expiration
      // This is a simplified approach - in a real implementation, we'd store metadata in a database
      const uploadedAt = new Date(stats.birthtime);
      const expiresAt = new Date(uploadedAt.getTime() + this.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000);

      return {
        id: fileId,
        originalName,
        storedPath: fullPath,
        size: stats.size,
        mimeType: this.getMimeType(originalName), // This would need to be stored with the file
        uploadedAt,
        expiresAt
      };
    } catch (error) {
      console.error(`Failed to get file info for ${fullPath}:`, error);
      return null;
    }
  }

  /**
   * Encrypts a buffer using AES
   */
  private static encryptBuffer(buffer: Buffer, options: EncryptionOptions): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(options.algorithm, options.key);
    const encrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return encrypted;
  }

  /**
   * Decrypts a buffer using AES
   */
  private static decryptBuffer(buffer: Buffer, options: EncryptionOptions): Buffer {
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);
    const decipher = crypto.createDecipher(options.algorithm, options.key);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted;
  }

  /**
   * Gets MIME type based on file extension
   */
  private static getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }
}