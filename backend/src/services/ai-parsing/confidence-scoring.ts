export interface ConfidenceFactors {
  patternMatchQuality: number;
  dataCompleteness: number;
  contextRelevance: number;
  sourceReliability: number;
}

export interface FieldConfidence {
  fieldName: string;
  value: string;
  confidenceScore: number;
  factors: ConfidenceFactors;
}

export class ConfidenceScoring {
  /**
   * Calculates the confidence score for a single field
   */
  static calculateFieldConfidence(
    fieldName: string,
    value: string,
    textContext: string = '',
    source: 'text' | 'image' | 'OCR' = 'text'
  ): FieldConfidence {
    const factors = this.calculateConfidenceFactors(fieldName, value, textContext, source);

    // Weighted average of factors to produce final confidence score
    const confidenceScore = this.computeWeightedConfidence(factors);

    return {
      fieldName,
      value,
      confidenceScore,
      factors
    };
  }

  /**
   * Calculates confidence factors for a field
   */
  private static calculateConfidenceFactors(
    fieldName: string,
    value: string,
    textContext: string,
    source: 'text' | 'image' | 'OCR'
  ): ConfidenceFactors {
    return {
      patternMatchQuality: this.calculatePatternMatchQuality(fieldName, value),
      dataCompleteness: this.calculateDataCompleteness(fieldName, value),
      contextRelevance: this.calculateContextRelevance(fieldName, value, textContext),
      sourceReliability: this.calculateSourceReliability(source)
    };
  }

  /**
   * Calculates pattern match quality based on field type and value
   */
  private static calculatePatternMatchQuality(fieldName: string, value: string): number {
    // Define expected patterns for each field type
    const patterns: { [key: string]: RegExp } = {
      vendor: /^[A-Za-z\s\-\.\,\&\'\(\)]{3,50}$/, // Alphabetic chars, spaces, and common symbols
      invoiceNumber: /^[A-Za-z0-9\s\-\_\/]{2,20}$/, // Alphanumeric with separators
      date: /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|([A-Za-z]+\s+\d{1,2},?\s+\d{4})$/, // Various date formats
      amount: /^[\$€£¥]?\s*[\d,]+\.?\d{2}$/, // Currency symbol and number formats
    };

    const pattern = patterns[fieldName];
    if (!pattern) {
      // If no specific pattern, just check if value is not empty
      return value.trim().length > 0 ? 0.6 : 0;
    }

    const match = value.match(pattern);
    if (match) {
      // Strong match - return high confidence
      return 0.9;
    } else {
      // Partial match or no match - return lower confidence
      // But still give some credit if the value looks reasonable
      if (this.isPlausibleValue(fieldName, value)) {
        return 0.5;
      } else {
        return 0.2;
      }
    }
  }

  /**
   * Calculates data completeness based on expected field requirements
   */
  private static calculateDataCompleteness(fieldName: string, value: string): number {
    if (!value || value.trim().length === 0) {
      return 0;
    }

    // Define completeness thresholds for each field
    const thresholds: { min: number; max: number } = {
      vendor: { min: 2, max: 100 },
      invoiceNumber: { min: 2, max: 20 },
      date: { min: 8, max: 12 }, // Assuming date format like MM/DD/YYYY
      amount: { min: 3, max: 20 } // Amount with currency
    };

    const threshold = thresholds[fieldName as keyof typeof thresholds] || { min: 1, max: 100 };
    const length = value.trim().length;

    if (length < threshold.min) {
      return 0.3; // Value too short
    } else if (length > threshold.max) {
      return 0.5; // Value possibly too long, but still valid
    } else {
      // Normalize to 0-1 range based on optimal length
      const optimalRange = (threshold.max - threshold.min) / 2;
      const optimalCenter = threshold.min + optimalRange;

      // Higher confidence for lengths closer to optimal
      const distanceFromOptimal = Math.abs(length - optimalCenter);
      const normalizedDistance = distanceFromOptimal / optimalRange;

      return Math.max(0.6, 1 - normalizedDistance);
    }
  }

  /**
   * Calculates context relevance based on surrounding text
   */
  private static calculateContextRelevance(fieldName: string, value: string, textContext: string): number {
    if (!textContext) {
      return 0.5; // Neutral if no context provided
    }

    // Define context keywords for each field type
    const contextKeywords: { [key: string]: string[] } = {
      vendor: ['vendor', 'supplier', 'bill to', 'to:', 'company', 'business'],
      invoiceNumber: ['invoice', 'inv', 'number', 'no.', 'ref', 'reference'],
      date: ['date', 'issued', 'invoice date', 'billing date', 'due date'],
      amount: ['total', 'amount', 'balance', 'due', 'payment', 'cost', 'price']
    };

    const keywords = contextKeywords[fieldName] || [];
    if (keywords.length === 0) {
      return 0.5; // Neutral if no keywords defined
    }

    // Count how many context keywords appear near the value in the text
    let contextMatches = 0;
    const textLower = textContext.toLowerCase();

    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        contextMatches++;
      }
    }

    // Calculate relevance score based on keyword matches
    const relevanceScore = contextMatches / keywords.length;
    return Math.min(relevanceScore, 1.0);
  }

  /**
   * Calculates reliability based on the source of the data
   */
  private static calculateSourceReliability(source: 'text' | 'image' | 'OCR'): number {
    // OCR typically has lower reliability than direct text extraction
    switch (source) {
      case 'text':
        return 0.9; // Highest reliability for direct text extraction
      case 'image':
        return 0.7; // Medium reliability for image extraction
      case 'OCR':
        return 0.6; // Lower reliability for OCR due to potential errors
      default:
        return 0.5; // Default reliability
    }
  }

  /**
   * Computes weighted confidence from all factors
   */
  private static computeWeightedConfidence(factors: ConfidenceFactors): number {
    // Define weights for each factor
    const weights = {
      patternMatchQuality: 0.4,
      dataCompleteness: 0.2,
      contextRelevance: 0.25,
      sourceReliability: 0.15
    };

    // Calculate weighted average
    const weightedSum =
      factors.patternMatchQuality * weights.patternMatchQuality +
      factors.dataCompleteness * weights.dataCompleteness +
      factors.contextRelevance * weights.contextRelevance +
      factors.sourceReliability * weights.sourceReliability;

    return Math.min(weightedSum, 1.0);
  }

  /**
   * Checks if a value is plausible for a given field type
   */
  private static isPlausibleValue(fieldName: string, value: string): boolean {
    switch (fieldName) {
      case 'vendor':
        // Vendor should contain letters and be reasonably long
        return /[a-zA-Z]/.test(value) && value.length >= 3;
      case 'invoiceNumber':
        // Invoice number should contain alphanumeric characters
        return /[a-zA-Z0-9]/.test(value);
      case 'date':
        // Date should contain numbers and separators
        return /\d{2}.*\d{2}/.test(value);
      case 'amount':
        // Amount should contain numbers and potentially currency symbols
        return /[\d\.]/.test(value);
      default:
        return value.length > 0;
    }
  }

  /**
   * Adjusts confidence based on cross-field validation
   */
  static adjustConfidenceWithCrossValidation(fieldConfidences: FieldConfidence[]): FieldConfidence[] {
    // For now, we'll just return the confidences as-is
    // In a more sophisticated system, we might adjust based on:
    // - Consistency between related fields
    // - Plausibility of the combination of fields
    // - Comparison with known valid data patterns

    return fieldConfidences;
  }

  /**
   * Converts numeric confidence to qualitative assessment
   */
  static confidenceToQualitative(confidence: number): 'very-high' | 'high' | 'medium' | 'low' | 'very-low' {
    if (confidence >= 0.9) return 'very-high';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence >= 0.3) return 'low';
    return 'very-low';
  }
}