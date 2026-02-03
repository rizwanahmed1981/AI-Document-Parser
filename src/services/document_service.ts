import { DocumentModel } from '../models/document';
import { UploadSessionModel } from '../models/upload_session';
import { Document } from '../models/document';
import { UploadSession } from '../models/upload_session';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class DocumentService {
  private documentModel: DocumentModel;
  private uploadSessionModel: UploadSessionModel;

  constructor() {
    this.documentModel = new DocumentModel();
    this.uploadSessionModel = new UploadSessionModel();
  }

  /**
   * Create a new document
   */
  async createDocument(
    fileName: string,
    fileType: string,
    fileSize: number,
    userId?: string,
    filePath?: string
  ): Promise<Document> {
    // Generate checksum for file integrity
    const checksum = filePath ? this.generateChecksum(filePath) : undefined;

    try {
      const document = await this.documentModel.create(
        fileName,
        fileType,
        fileSize,
        userId,
        filePath,
        checksum
      );

      return document;
    } catch (error) {
      throw new Error(`Failed to create document: ${(error as Error).message}`);
    }
  }

  /**
   * Create an upload session
   */
  async createUploadSession(
    originalFileName: string,
    tempFilePath: string,
    fileSize: number,
    userId?: string
  ): Promise<UploadSession> {
    try {
      const uploadSession = await this.uploadSessionModel.create(
        originalFileName,
        tempFilePath,
        fileSize,
        userId
      );

      return uploadSession;
    } catch (error) {
      throw new Error(`Failed to create upload session: ${(error as Error).message}`);
    }
  }

  /**
   * Generate SHA-256 checksum for a file
   */
  private generateChecksum(filePath: string): string {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`Failed to generate checksum: ${(error as Error).message}`);
    }
  }

  /**
   * Update document processing status
   */
  async updateDocumentStatus(documentId: string, status: string): Promise<Document> {
    try {
      const document = await this.documentModel.updateStatus(documentId, status);
      return document;
    } catch (error) {
      throw new Error(`Failed to update document status: ${(error as Error).message}`);
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<Document | null> {
    try {
      const document = await this.documentModel.getById(documentId);
      return document;
    } catch (error) {
      throw new Error(`Failed to get document: ${(error as Error).message}`);
    }
  }

  /**
   * Get documents by user ID
   */
  async getDocumentsByUserId(userId: string): Promise<Document[]> {
    try {
      const documents = await this.documentModel.getByUserId(userId);
      return documents;
    } catch (error) {
      throw new Error(`Failed to get documents: ${(error as Error).message}`);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // In a real implementation, you would also delete the file from storage
      const deleted = await this.documentModel.delete(documentId);
      return deleted;
    } catch (error) {
      throw new Error(`Failed to delete document: ${(error as Error).message}`);
    }
  }

  /**
   * Process uploaded document (simulate processing)
   */
  async processDocument(documentId: string): Promise<Document> {
    try {
      // Update document status to "processing"
      let document = await this.updateDocumentStatus(documentId, 'processing');

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update document status to "completed"
      document = await this.updateDocumentStatus(documentId, 'completed');

      return document;
    } catch (error) {
      // Update document status to "failed" on error
      await this.updateDocumentStatus(documentId, 'failed');
      throw new Error(`Failed to process document: ${(error as Error).message}`);
    }
  }
}