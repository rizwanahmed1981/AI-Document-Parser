import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Add userId to the request object
    req.userId = (decoded as any).userId;
    next();
  });
};

// Mock user validation - in a real implementation, this would check against a database
export const validateUser = (userId: string): boolean => {
  // This is a placeholder - in a real implementation,
  // this would verify the user exists in the database
  return userId !== undefined && userId.length > 0;
};

// Generate a token for a user
export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign({ userId }, secret, { expiresIn });
};