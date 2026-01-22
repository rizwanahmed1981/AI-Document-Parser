import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/error-handling';

// Validation functions for file uploads
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  // Check if file exists in request
  if (!req.file) {
    return next(new ValidationError('File is required'));
  }

  const file = req.file;

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) { // 10MB
    return next(new ValidationError(`File size exceeds 10MB limit. Current size: ${file.size} bytes`));
  }

  // Validate file type (only PDF allowed)
  if (file.mimetype !== 'application/pdf') {
    return next(new ValidationError(`Invalid file type: ${file.mimetype}. Only PDF files are allowed.`));
  }

  // Validate file extension
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (fileExtension !== '.pdf') {
    return next(new ValidationError(`Invalid file extension: ${fileExtension}. Only .pdf files are allowed.`));
  }

  next();
};

// Validation for user ID
export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.body.userId || req.query.userId || (req as any).userId;

  if (!userId) {
    return next(new ValidationError('User ID is required'));
  }

  // Basic validation for UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return next(new ValidationError('Invalid User ID format. Expected UUID.'));
  }

  next();
};

// Validation for retention preference
export const validateRetention = (req: Request, res: Response, next: NextFunction) => {
  const retain = req.body.retain;

  // If retain is provided, it must be a boolean
  if (retain !== undefined && typeof retain !== 'boolean') {
    return next(new ValidationError('Retention preference must be a boolean value'));
  }

  next();
};

// Validation for invoice ID
export const validateInvoiceId = (req: Request, res: Response, next: NextFunction) => {
  const invoiceId = req.params.id || req.body.id;

  if (!invoiceId) {
    return next(new ValidationError('Invoice ID is required'));
  }

  // Basic validation for UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(invoiceId)) {
    return next(new ValidationError('Invalid Invoice ID format. Expected UUID.'));
  }

  next();
};

// Generic validation middleware for required fields
export const validateRequiredFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        errors.push(`${field} is required`);
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError(errors.join(', ')));
    }

    next();
  };
};

// Validation for query parameters
export const validateQueryParams = (req: Request, res: Response, next: NextFunction) => {
  // Validate pagination parameters if present
  const page = req.query.page;
  const limit = req.query.limit;

  if (page !== undefined) {
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
      return next(new ValidationError('Page must be a positive integer'));
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(new ValidationError('Limit must be a positive integer between 1 and 100'));
    }
  }

  next();
};

// Validation for specific field types in request body
export const validateInvoiceFields = (req: Request, res: Response, next: NextFunction) => {
  const { vendor, invoiceNumber, date, amount } = req.body;

  // Validate vendor if provided
  if (vendor && typeof vendor !== 'string') {
    return next(new ValidationError('Vendor must be a string'));
  }

  // Validate invoice number if provided
  if (invoiceNumber && typeof invoiceNumber !== 'string') {
    return next(new ValidationError('Invoice number must be a string'));
  }

  // Validate date if provided
  if (date && typeof date !== 'string') {
    return next(new ValidationError('Date must be a string'));
  }

  // Validate amount if provided
  if (amount && typeof amount !== 'string' && typeof amount !== 'number') {
    return next(new ValidationError('Amount must be a string or number'));
  }

  next();
};

// Combined validation middleware for upload endpoint
export const validateUploadRequest = [
  validateFileUpload,
  validateUserId,
  validateRetention
];

// Combined validation middleware for parse endpoint
export const validateParseRequest = [
  validateInvoiceId,
  validateUserId
];