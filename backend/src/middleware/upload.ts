import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create a temporary directory for uploads
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using timestamp and original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow PDF files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'));
  }
};

// Create the multer instance with configuration
export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Export a validation function for additional file validation
export const validateFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check file size (already handled by multer limits, but good to double check)
  if (file.size > 10 * 1024 * 1024) { // 10MB
    return { isValid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file extension
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (fileExt !== '.pdf') {
    return { isValid: false, error: 'Invalid file type. Only PDF files are allowed.' };
  }

  return { isValid: true };
};