import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import dotenv from 'dotenv';

dotenv.config();

// Configure Passport OAuth2 strategy
passport.use(new OAuth2Strategy({
  authorizationURL: process.env.OAUTH_AUTHORIZATION_URL || 'https://api.documentparser.com/oauth/authorize',
  tokenURL: process.env.OAUTH_TOKEN_URL || 'https://api.documentparser.com/oauth/token',
  clientID: process.env.OAUTH_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
  callbackURL: process.env.OAUTH_CALLBACK_URL || 'https://api.documentparser.com/oauth/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // In a real implementation, you would verify the user against your database
    // and return the user object
    return done(null, profile);
  } catch (error) {
    return done(error);
  }
}));

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('oauth2', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        error: 'Authentication Error',
        message: 'Failed to authenticate request'
      });
    }

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token'
      });
    }

    // Attach user to request object
    (req as any).user = user;
    next();
  })(req, res, next);
};

// OAuth2 authentication middleware
export const oauth2Authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('oauth2', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        error: 'Authentication Error',
        message: 'Failed to authenticate OAuth2 request'
      });
    }

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing OAuth2 token'
      });
    }

    // Attach user to request object
    (req as any).user = user;
    next();
  })(req, res, next);
};

// JWT authentication middleware (fallback)
export const jwtAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  // This is a simplified JWT authentication middleware
  // In a real implementation, you would verify JWT tokens
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header'
    });
  }

  // In a real implementation, you would verify the JWT token
  // For now, we'll just proceed with a mock user
  (req as any).user = { id: 'mock-user-id' };
  next();
};