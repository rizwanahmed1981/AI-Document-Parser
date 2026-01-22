import { createWorker, PSM } from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export interface OcrResult {
  text: string;
  confidence: number;
  raw?: any;
}

export class OcrService {
  private static worker: any = null;

  /**
   * Initializes the OCR worker
   */
  static async initializeOcr(): Promise<void> {
    if (this.worker) {
      return;
    }

    try {
      this.worker = createWorker({
        logger: (m) => {
          // Optionally log progress
          // console.log(m);
        },
      });

      await this.worker.load();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');

      // Set page segmentation mode to handle various layouts
      await this.worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?/~`"',
      });
    } catch (error) {
      throw new Error(`Failed to initialize OCR service: ${error.message}`);
    }
  }

  /**
   * Performs OCR on an image buffer
   */
  static async performOcrOnImage(imageBuffer: Buffer): Promise<OcrResult> {
    if (!this.worker) {
      await this.initializeOcr();
    }

    try {
      const tempImagePath = await this.saveTempImage(imageBuffer);
      const result = await this.worker.recognize(tempImagePath);

      // Clean up temp file
      fs.unlinkSync(tempImagePath);

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        raw: result.data
      };
    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Performs OCR on a PDF by converting to images first
   */
  static async performOcrOnPdf(pdfBuffer: Buffer): Promise<OcrResult> {
    // Note: For full PDF OCR, we'd need to convert each page to an image first
    // This is a simplified implementation that assumes PDF conversion is handled elsewhere
    // In a real implementation, we'd use a library like pdf-lib to extract images or
    // convert PDF pages to images

    // For now, we'll throw an error indicating this needs more implementation
    throw new Error('Full PDF OCR requires additional implementation to convert PDF pages to images first');
  }

  /**
   * Saves a buffer as a temporary image file
   */
  private static async saveTempImage(imageBuffer: Buffer): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPath = path.join(tempDir, `temp_image_${Date.now()}.png`);
    fs.writeFileSync(tempPath, imageBuffer);

    return tempPath;
  }

  /**
   * Processes an image file for OCR
   */
  static async processImageForOcr(filePath: string): Promise<OcrResult> {
    if (!this.worker) {
      await this.initializeOcr();
    }

    try {
      const result = await this.worker.recognize(filePath);
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        raw: result.data
      };
    } catch (error) {
      throw new Error(`OCR processing failed for file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Disposes the OCR worker
   */
  static async dispose(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}