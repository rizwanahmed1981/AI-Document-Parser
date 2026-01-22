import { PdfProcessingService } from './document-processing/pdf-processing';
import { OcrService } from './ocr-processing/ocr-service';
import { InvoiceModel, FieldModel } from '../models/invoice';
import { StorageService } from './storage-service';

export interface ParseResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidenceScore?: number;
  fields: any[];
  errors?: string[];
}

export interface ExtractionRules {
  vendor?: RegExp;
  invoiceNumber?: RegExp;
  date?: RegExp;
  amount?: RegExp;
}

export class ParsingService {
  /**
   * Parses an invoice from a PDF file
   */
  static async parseInvoice(pdfBuffer: Buffer, extractionRules?: ExtractionRules): Promise<ParseResult> {
    try {
      // Determine if the PDF has a text layer or is scanned
      const hasTextLayer = await PdfProcessingService.hasTextLayer(pdfBuffer);

      let extractedText = '';

      if (hasTextLayer) {
        // Extract text directly from the PDF
        const textResult = await PdfProcessingService.extractTextFromPdf(pdfBuffer);
        extractedText = textResult.text;
      } else {
        // The PDF is likely a scanned document, need to use OCR
        // For now, we'll throw an error since full PDF OCR requires additional implementation
        // In a real implementation, we'd convert PDF pages to images and then perform OCR
        throw new Error('Scanned PDFs require additional implementation for OCR processing');
      }

      // Extract fields from the text
      const fields = this.extractFields(extractedText, extractionRules);

      // Calculate overall confidence score
      const confidenceScore = this.calculateConfidenceScore(fields);

      return {
        id: 'placeholder-id', // In real implementation, this would come from DB
        status: 'completed',
        confidenceScore,
        fields,
        errors: fields.length === 0 ? ['No fields were extracted from the document'] : undefined
      };
    } catch (error) {
      return {
        id: 'placeholder-id',
        status: 'failed',
        errors: [error.message]
      };
    }
  }

  /**
   * Extracts specific fields from text content
   */
  private static extractFields(text: string, customRules?: ExtractionRules): any[] {
    // Default extraction rules
    const defaultRules: ExtractionRules = {
      vendor: /vendor[:\s]+([^\n\r]+)/i,
      invoiceNumber: /(invoice\s*number|inv\s*no|inv[-_\s]*\d+)[-:\s]+([^\n\r]+)/i,
      date: /(invoice\s*date|date\s*of\s*issue|issued?\s*on)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|[a-z]+\s+\d{1,2},?\s+\d{4})/i,
      amount: /(total|amount|balance)[\s\d\w]*[:\s\$]+([\d,]+\.?\d{2}?)/i
    };

    // Combine default rules with custom rules
    const rules = { ...defaultRules, ...customRules };

    const fields = [];
    const lowerText = text.toLowerCase();

    // Extract vendor
    if (rules.vendor) {
      const vendorMatch = text.match(rules.vendor);
      if (vendorMatch && vendorMatch[1]) {
        fields.push({
          fieldName: 'vendor',
          value: vendorMatch[1].trim(),
          confidenceScore: this.estimateConfidence(vendorMatch[1]),
          extractedFrom: 'text'
        });
      }
    }

    // Extract invoice number
    if (rules.invoiceNumber) {
      const invMatch = text.match(rules.invoiceNumber);
      if (invMatch && invMatch[2]) {
        fields.push({
          fieldName: 'invoiceNumber',
          value: invMatch[2].trim(),
          confidenceScore: this.estimateConfidence(invMatch[2]),
          extractedFrom: 'text'
        });
      }
    }

    // Extract date
    if (rules.date) {
      const dateMatch = text.match(rules.date);
      if (dateMatch && dateMatch[2]) {
        fields.push({
          fieldName: 'date',
          value: dateMatch[2].trim(),
          confidenceScore: this.estimateConfidence(dateMatch[2]),
          extractedFrom: 'text'
        });
      }
    }

    // Extract amount
    if (rules.amount) {
      const amountMatch = text.match(rules.amount);
      if (amountMatch && amountMatch[2]) {
        fields.push({
          fieldName: 'amount',
          value: amountMatch[2].trim(),
          confidenceScore: this.estimateConfidence(amountMatch[2]),
          extractedFrom: 'text'
        });
      }
    }

    // If no fields were extracted with the specific rules, try general pattern matching
    if (fields.length === 0) {
      fields.push(...this.generalPatternMatching(text));
    }

    return fields;
  }

  /**
   * Performs general pattern matching for common invoice fields
   */
  private static generalPatternMatching(text: string): any[] {
    const fields = [];

    // Look for common vendor patterns
    const vendorPatterns = [
      /to:\s*([^\n\r]{3,50})/i,
      /bill\s*to:\s*([^\n\r]{3,50})/i,
      /pay\s*to:\s*([^\n\r]{3,50})/i,
      /vendor:\s*([^\n\r]{3,50})/i,
      /company:\s*([^\n\r]{3,50})/i,
      /[^\n\r]*\n\s*(?:llc|inc|corp|ltd|pty)[,.\s\n]/gi
    ];

    for (const pattern of vendorPatterns) {
      const match = text.match(pattern);
      if (match && !fields.some(f => f.fieldName === 'vendor')) {
        let vendorValue = '';

        if (match[1]) {
          vendorValue = match[1].trim();
        } else {
          // For patterns without capturing groups, extract the relevant part
          const fullMatch = match[0];
          if (fullMatch.toLowerCase().includes('to:') || fullMatch.toLowerCase().includes('bill to:')) {
            vendorValue = fullMatch.split(':')[1]?.trim() || '';
          } else {
            vendorValue = fullMatch.replace(/(?:llc|inc|corp|ltd|pty)[,.\s\n]/gi, '').trim();
          }
        }

        if (vendorValue && vendorValue.length > 2) {
          fields.push({
            fieldName: 'vendor',
            value: vendorValue,
            confidenceScore: this.estimateConfidence(vendorValue),
            extractedFrom: 'text'
          });
          break;
        }
      }
    }

    // Look for invoice number patterns
    const invPatterns = [
      /invoice\s*[#:\s]+([a-z0-9\-\/]+)$/mi,
      /inv\s*[#:\s]+([a-z0-9\-\/]+)$/mi,
      /ref\s*[#:\s]+([a-z0-9\-\/]+)$/mi,
      /no\.?\s*[:\s]+([a-z0-9\-\/]+)/i
    ];

    for (const pattern of invPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && !fields.some(f => f.fieldName === 'invoiceNumber')) {
        const invValue = match[1].trim();
        fields.push({
          fieldName: 'invoiceNumber',
          value: invValue,
          confidenceScore: this.estimateConfidence(invValue),
          extractedFrom: 'text'
        });
        break;
      }
    }

    // Look for date patterns
    const datePatterns = [
      /invoice\s*date[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /date\s*of\s*issue[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /issued?\s*on[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g
    ];

    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches && !fields.some(f => f.fieldName === 'date')) {
        // Take the first date that looks like an invoice date
        for (const match of matches) {
          if (match.toLowerCase().includes('date') || match.length < 15) {
            const dateMatch = text.match(pattern);
            if (dateMatch && dateMatch[1]) {
              const dateValue = dateMatch[1].trim();
              fields.push({
                fieldName: 'date',
                value: dateValue,
                confidenceScore: this.estimateConfidence(dateValue),
                extractedFrom: 'text'
              });
              break;
            }
          }
        }
        break;
      }
    }

    // Look for amount patterns
    const amountPatterns = [
      /(?:total|amount|balance)[\s\d\w]*[:\s]+\$?([\d,]+\.?\d{2})/i,
      /\$(\d+\.?\d{2})/g,
      /([$£€¥]\s*\d+\.?\d{2})/g
    ];

    for (const pattern of amountPatterns) {
      const matches = text.match(pattern);
      if (matches && !fields.some(f => f.fieldName === 'amount')) {
        // Find the most likely total amount (usually the largest)
        const amounts = matches.map(match => {
          const numStr = match.replace(/[^\d.]/g, '');
          return parseFloat(numStr);
        }).filter(num => !isNaN(num));

        if (amounts.length > 0) {
          const maxValue = Math.max(...amounts);
          const maxAmountStr = matches[amounts.indexOf(maxValue)].trim();

          fields.push({
            fieldName: 'amount',
            value: maxAmountStr,
            confidenceScore: this.estimateConfidence(maxAmountStr),
            extractedFrom: 'text'
          });
          break;
        }
      }
    }

    return fields;
  }

  /**
   * Estimates confidence score based on the extracted value
   */
  private static estimateConfidence(value: string): number {
    // Simple confidence estimation based on value characteristics
    if (!value || value.trim().length === 0) {
      return 0;
    }

    // Higher confidence for values that match expected patterns
    let confidence = 0.5; // Base confidence

    // Boost for values that look like valid data
    if (value.match(/^\d+[-\s]?\d+[-\s]?\d+$/)) { // Looks like an ID
      confidence += 0.2;
    } else if (value.match(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/)) { // Looks like a date
      confidence += 0.3;
    } else if (value.match(/[\d,]+\.?\d{2}/)) { // Looks like an amount
      confidence += 0.2;
    } else if (value.length > 5 && !value.match(/\d/)) { // Looks like a vendor name
      confidence += 0.1;
    }

    // Cap at 0.95 to indicate it's not 100% certain
    return Math.min(confidence, 0.95);
  }

  /**
   * Calculates overall confidence score from field confidences
   */
  private static calculateConfidenceScore(fields: any[]): number {
    if (fields.length === 0) {
      return 0;
    }

    const totalConfidence = fields.reduce((sum, field) => {
      return sum + (field.confidenceScore || 0.5); // Default to 0.5 if no confidence provided
    }, 0);

    return totalConfidence / fields.length;
  }

  /**
   * Processes a stored file by ID
   */
  static async parseStoredFile(fileId: string, extractionRules?: ExtractionRules): Promise<ParseResult> {
    try {
      // Retrieve the file from storage
      const fileBuffer = await StorageService.retrieveFile(fileId);

      if (!fileBuffer) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      // Parse the file
      return await this.parseInvoice(fileBuffer, extractionRules);
    } catch (error) {
      return {
        id: fileId,
        status: 'failed',
        errors: [error.message]
      };
    }
  }
}