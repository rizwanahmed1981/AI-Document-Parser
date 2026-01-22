import { Request, Response, NextFunction } from 'express';
import multer, { diskStorage } from 'multer';
import { DocumentModel } from '../../models/document';
import { UploadSessionModel } from '../../models/upload_session';

// Supported file types
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain',
  'text/html'
];

const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpeg',
  '.jpg',
  '.png',
  '.txt',
  '.html'
];

// Configure multer storage
const storage = diskStorage({
  destination: (req, file, cb) => {
    // In a real implementation, you would check if the directory exists
    // For now, we'll use a default temp directory
    cb(null, 'tmp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + getFileExtension(file.originalname));
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  // Check file extension
  const ext = getFileExtension(file.originalname).toLowerCase();
  const isValidExtension = SUPPORTED_EXTENSIONS.includes(ext);

  // Check MIME type
  const isValidMimeType = SUPPORTED_MIME_TYPES.includes(file.mimetype);

  if (isValidExtension && isValidMimeType) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

// Create multer instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5242880 // 5MB limit
  }
});

// Helper function to get file extension
function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.'));
}

// Validation middleware
export const validateFile = (req: Request, res: Response, next: NextFunction) => {
  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'No file uploaded'
    });
  }

  // Validate file size
  if (req.file.size > 5242880) { // 5MB limit
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'File size exceeds maximum limit of 5MB'
    });
  }

  // Validate file type
  const ext = getFileExtension(req.file.originalname).toLowerCase();
  const isValidExtension = SUPPORTED_EXTENSIONS.includes(ext);
  const isValidMimeType = SUPPORTED_MIME_TYPES.includes(req.file.mimetype);

  if (!isValidExtension || !isValidMimeType) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      message: 'File type not supported. Supported types: PDF, DOCX, JPEG, PNG, TXT, HTML'
    });
  }

  // All validations passed
  next();
};

// File integrity validation
export const validateFileIntegrity = (req: Request, res: Response, next: NextFunction) => {
  // In a real implementation, this would validate file integrity
  // For now, we'll just pass through
  next();
};