import { PdfProcessingService } from '../document-processing/pdf-processing';
import { OcrService } from '../ocr-processing/ocr-service';
import { ConfidenceScoring, FieldConfidence } from './confidence-scoring';
import { StorageService } from '../storage-service';

export interface ExtractionResult {
  vendor?: FieldConfidence;
  invoiceNumber?: FieldConfidence;
  date?: FieldConfidence;
  amount?: FieldConfidence;
  extractedText?: string;
  sourceType: 'text' | 'ocr';
}

export interface ExtractionOptions {
  useOcrFallback?: boolean;
  customPatterns?: { [key: string]: RegExp };
  contextWindow?: number;
}

export class AiParsingService {
  /**
   * Main method to parse an invoice from a PDF buffer
   */
  static async parseInvoiceFromPdf(
    pdfBuffer: Buffer,
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    try {
      // Determine if the PDF has a text layer or is scanned
      const hasTextLayer = await PdfProcessingService.hasTextLayer(pdfBuffer);

      if (hasTextLayer) {
        // Extract text directly from the PDF
        const textResult = await PdfProcessingService.extractTextFromPdf(pdfBuffer);
        return this.parseInvoiceFromText(textResult.text, options);
      } else if (options.useOcrFallback) {
        // The PDF is a scanned document, use OCR
        // For now, we'll throw an error since full PDF OCR requires additional implementation
        // In a real implementation, we'd convert PDF pages to images and then perform OCR
        throw new Error('Scanned PDF OCR processing requires additional implementation');
      } else {
        throw new Error('PDF contains no text layer and OCR fallback is disabled');
      }
    } catch (error) {
      throw new Error(`AI parsing failed: ${error.message}`);
    }
  }

  /**
   * Parses an invoice from text content
   */
  static async parseInvoiceFromText(
    text: string,
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    try {
      // Define default patterns for extraction
      const defaultPatterns: { [key: string]: RegExp } = {
        vendor: /(?:(?:bill\s*to|vendor|supplier|to):\s*|from:\s*)([^\n\r]{10,100})(?=\n|$)/i,
        invoiceNumber: /(?:invoice\s*(?:number|no|ref)|inv\s*no|ref\s*no|no\.?)\s*[:\-\s]+([A-Z0-9\-\/\s]{5,20})/i,
        date: /(?:invoice\s*date|date\s*of\s*issue|issued?\s*on)\s*[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|[A-Z]+\s+\d{1,2},?\s+\d{4})/i,
        amount: /(?:total|amount|balance|due)\s*[:\s]+([\$€£¥]?\s*[\d,]+\.?\d{2})/i
      };

      // Combine default patterns with custom patterns
      const patterns = { ...defaultPatterns, ...options.customPatterns };

      const result: ExtractionResult = {
        sourceType: 'text',
        extractedText: text
      };

      // Extract each field
      for (const [fieldName, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const fieldValue = match[1].trim();

          // Calculate confidence for this field
          const fieldConfidence = ConfidenceScoring.calculateFieldConfidence(
            fieldName,
            fieldValue,
            text,
            'text'
          );

          // Add to result
          (result as any)[fieldName] = fieldConfidence;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Text parsing failed: ${error.message}`);
    }
  }

  /**
   * Parses an invoice from a stored file
   */
  static async parseInvoiceFromStoredFile(
    fileId: string,
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    try {
      // Retrieve the file from storage
      const fileBuffer = await StorageService.retrieveFile(fileId);

      if (!fileBuffer) {
        throw new Error(`File with ID ${fileId} not found in storage`);
      }

      // Parse the file
      return await this.parseInvoiceFromPdf(fileBuffer, options);
    } catch (error) {
      throw new Error(`Failed to parse stored file ${fileId}: ${error.message}`);
    }
  }

  /**
   * Performs intelligent field mapping based on context
   */
  static mapFieldsWithContext(
    extractedFields: Partial<ExtractionResult>,
    documentContext: string
  ): Partial<ExtractionResult> {
    // This would implement more sophisticated field mapping based on document structure
    // For now, we'll just return the extracted fields as-is
    return extractedFields;
  }

  /**
   * Validates extracted fields for consistency
   */
  static validateExtractedFields(fields: Partial<ExtractionResult>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate that we have at least one essential field
    const essentialFields = ['vendor', 'invoiceNumber', 'date', 'amount'];
    const hasEssentialField = essentialFields.some(field => (fields as any)[field]);

    if (!hasEssentialField) {
      errors.push('No essential fields (vendor, invoice number, date, or amount) were extracted');
    }

    // Validate date format if present
    if (fields.date && fields.date.value) {
      const dateStr = fields.date.value;
      const dateRegex = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|[A-Z]+\s+\d{1,2},?\s+\d{4})$/i;

      if (!dateRegex.test(dateStr)) {
        errors.push(`Date format is invalid: ${dateStr}`);
      }
    }

    // Validate amount format if present
    if (fields.amount && fields.amount.value) {
      const amountStr = fields.amount.value;
      const amountRegex = /[\$€£¥]?\s*[\d,]+\.?\d{2}/;

      if (!amountRegex.test(amountStr)) {
        errors.push(`Amount format is invalid: ${amountStr}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Applies corrections to parsed fields
   */
  static applyCorrections(
    originalResult: ExtractionResult,
    corrections: { [key: string]: string }
  ): ExtractionResult {
    const correctedResult = { ...originalResult };

    for (const [fieldName, correctedValue] of Object.entries(corrections)) {
      if ((correctedResult as any)[fieldName]) {
        // Update the value and recalculate confidence
        const updatedField: FieldConfidence = {
          ...((correctedResult as any)[fieldName] as FieldConfidence),
          value: correctedValue,
          confidenceScore: 1.0 // Full confidence since it's manually corrected
        };

        (correctedResult as any)[fieldName] = updatedField;
      }
    }

    return correctedResult;
  }

  /**
   * Gets extraction statistics for analysis
   */
  static getExtractionStats(result: ExtractionResult): { [key: string]: any } {
    const stats: { [key: string]: any } = {
      sourceType: result.sourceType,
      fieldsExtracted: 0,
      totalFields: 4, // vendor, invoiceNumber, date, amount
      overallConfidence: 0,
      fieldDetails: {}
    };

    const fieldNames = ['vendor', 'invoiceNumber', 'date', 'amount'];
    let totalConfidence = 0;
    let fieldsFound = 0;

    for (const fieldName of fieldNames) {
      const field = (result as any)[fieldName];
      if (field) {
        stats.fieldDetails[fieldName] = {
          value: field.value,
          confidence: field.confidenceScore,
          quality: ConfidenceScoring.confidenceToQualitative(field.confidenceScore)
        };

        totalConfidence += field.confidenceScore;
        fieldsFound++;
      }
    }

    stats.fieldsExtracted = fieldsFound;
    stats.overallConfidence = fieldsFound > 0 ? totalConfidence / fieldsFound : 0;

    return stats;
  }
}