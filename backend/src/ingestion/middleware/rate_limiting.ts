import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Maximum 10 requests per minute per IP address.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
export const rateLimitMiddleware = limiter;

// Custom rate limiting middleware for specific endpoints
export const documentUploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Maximum 10 requests per minute per IP address.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP address as key
    return req.ip || 'unknown';
  }
});