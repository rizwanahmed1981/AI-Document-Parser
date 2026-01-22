import { Request, Response } from 'express';
import { ParsingService } from '../../../services/parsing-service';
import { AiParsingService } from '../../../services/ai-parsing/ai-parsing';
import { StorageService } from '../../../services/storage-service';
import { AppError } from '../../../utils/error-handling';
import { validateParseRequest } from '../../../middleware/validation';

export class ParseController {
  /**
   * Parses an invoice from an uploaded file
   */
  static async parseInvoice(req: Request, res: Response): Promise<Response> {
    try {
      // Validate the request
      const fileId = req.params.id || req.body.fileId;

      if (!fileId) {
        throw new AppError('File ID is required', 400);
      }

      // In a real implementation, we would validate the file ID and user permissions
      // For now, we'll proceed with parsing

      // Parse the invoice using AI service
      const parseResult = await AiParsingService.parseInvoiceFromStoredFile(fileId);

      // Format the response
      const response = {
        id: fileId,
        status: parseResult.sourceType === 'text' ? 'completed' : 'failed',
        confidenceScore: this.calculateOverallConfidence(parseResult),
        fields: this.formatFields(parseResult),
        sourceType: parseResult.sourceType,
        ...(parseResult.extractedText && { extractedTextPreview: this.getPreview(parseResult.extractedText, 200) }),
        message: 'Invoice parsed successfully'
      };

      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.statusCode
        });
      }

      return res.status(500).json({
        error: 'Internal server error during parsing',
        code: 500
      });
    }
  }

  /**
   * Parses an invoice from raw PDF buffer
   */
  static async parseInvoiceFromRaw(req: Request, res: Response): Promise<Response> {
    try {
      // Validate that we have a file
      if (!req.file) {
        throw new AppError('File is required', 400);
      }

      // Validate file size
      if (req.file.size > 10 * 1024 * 1024) { // 10MB
        throw new AppError('File size exceeds 10MB limit', 413);
      }

      // Validate file type
      if (req.file.mimetype !== 'application/pdf') {
        throw new AppError('Only PDF files are allowed', 415);
      }

      // Parse the invoice using AI service
      const parseResult = await AiParsingService.parseInvoiceFromPdf(req.file.buffer);

      // Format the response
      const response = {
        id: 'generated-id', // In real implementation, this would be a proper ID
        status: parseResult.sourceType === 'text' ? 'completed' : 'failed',
        confidenceScore: this.calculateOverallConfidence(parseResult),
        fields: this.formatFields(parseResult),
        sourceType: parseResult.sourceType,
        ...(parseResult.extractedText && { extractedTextPreview: this.getPreview(parseResult.extractedText, 200) }),
        message: 'Invoice parsed successfully'
      };

      return res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.statusCode
        });
      }

      return res.status(500).json({
        error: 'Internal server error during parsing',
        code: 500
      });
    }
  }

  /**
   * Gets processing results for a file
   */
  static async getResults(req: Request, res: Response): Promise<Response> {
    try {
      const fileId = req.params.id;

      if (!fileId) {
        throw new AppError('File ID is required', 400);
      }

      // In a real implementation, this would fetch from database
      // For now, we'll simulate the results
      const results = {
        id: fileId,
        status: 'completed',
        progress: 100,
        confidenceScore: 0.85,
        errors: [] as string[],
        createdAt: new Date(),
        processedAt: new Date(),
        message: 'Processing complete'
      };

      return res.status(200).json(results);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.statusCode
        });
      }

      return res.status(500).json({
        error: 'Internal server error retrieving results',
        code: 500
      });
    }
  }

  /**
   * Calculates overall confidence from individual field confidences
   */
  private static calculateOverallConfidence(result: any): number {
    const fields = ['vendor', 'invoiceNumber', 'date', 'amount'];
    let totalConfidence = 0;
    let fieldCount = 0;

    for (const field of fields) {
      if (result[field] && result[field].confidenceScore) {
        totalConfidence += result[field].confidenceScore;
        fieldCount++;
      }
    }

    return fieldCount > 0 ? totalConfidence / fieldCount : 0;
  }

  /**
   * Formats fields for the response
   */
  private static formatFields(result: any): any[] {
    const fields = ['vendor', 'invoiceNumber', 'date', 'amount'];
    const formattedFields = [];

    for (const field of fields) {
      if (result[field]) {
        formattedFields.push({
          fieldName: field,
          value: result[field].value,
          confidenceScore: result[field].confidenceScore,
          quality: result[field].quality || 'medium'
        });
      }
    }

    return formattedFields;
  }

  /**
   * Gets a preview of text content
   */
  private static getPreview(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength) + '...';
  }
}