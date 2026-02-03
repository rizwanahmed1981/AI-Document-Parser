import { Request, Response, NextFunction } from 'express';
import multer, { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

// Configuration constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain',
  'text/html'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpeg', '.jpg', '.png', '.txt', '.html'];

// Create upload directory if it doesn't exist
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer upload
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Unsupported file type'));
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type'));
    }

    cb(null, true);
  }
});

// Validate file size and type
export const validateFile = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'No file uploaded'
    });
  }

  // Validate file size
  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'File size exceeds maximum limit of 5MB'
    });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      message: 'File type not supported. Supported types: PDF, DOCX, JPEG, PNG, TXT, HTML'
    });
  }

  next();
};

// Validate file integrity
export const validateFileIntegrity = (req: Request, res: Response, next: NextFunction) => {
  // In a real implementation, you would:
  // 1. Calculate checksum of uploaded file
  // 2. Compare with expected checksum
  // 3. Validate file content for corruption

  // For now, we'll just proceed with the validation
  next();
};

// Rate limiting middleware
export const documentUploadRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // In a real implementation, you would implement rate limiting
  // For now, we'll just proceed

  // This is a placeholder for rate limiting implementation
  next();
};