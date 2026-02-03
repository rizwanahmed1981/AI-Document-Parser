import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Environment configuration
export const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || 'document_parser'
  },

  // Security configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // OAuth configuration
  oauth: {
    clientId: process.env.OAUTH_CLIENT_ID || '',
    clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
    authorizationUrl: process.env.OAUTH_AUTHORIZATION_URL || 'https://api.documentparser.com/oauth/authorize',
    tokenUrl: process.env.OAUTH_TOKEN_URL || 'https://api.documentparser.com/oauth/token',
    callbackUrl: process.env.OAUTH_CALLBACK_URL || 'https://api.documentparser.com/oauth/callback'
  },

  // File upload configuration
  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB in bytes
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain',
      'text/html'
    ]
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10) // 10 requests per window
  }
};