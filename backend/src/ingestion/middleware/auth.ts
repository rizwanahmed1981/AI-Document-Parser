import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import { APIRequestModel, APIRequest } from '../../models/api_request';

// Configure OAuth2 strategy
passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: process.env.OAUTH_AUTHORIZATION_URL || 'https://api.example.com/oauth/authorize',
      tokenURL: process.env.OAUTH_TOKEN_URL || 'https://api.example.com/oauth/token',
      clientID: process.env.OAUTH_CLIENT_ID || '',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
      callbackURL: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/auth/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // In a real implementation, you would validate the user and return user data
        // For now, we'll just return a mock user
        return done(null, { id: profile.id, username: profile.username });
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Configure JWT strategy
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    },
    async (payload, done) => {
      try {
        // In a real implementation, you would fetch the user from database
        // For now, we'll just return a mock user
        return done(null, { id: payload.sub, username: payload.username });
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Create API request record
  const apiRequest: APIRequest = APIRequestModel.create(
    undefined, // userId
    req.headers['x-client-id'] as string || '', // clientId
    req.ip, // ipAddress
    req.get('User-Agent'), // userAgent
    undefined, // documentId
    req.path // endpoint
  );

  // Store API request in request object for later use
  (req as any).apiRequest = apiRequest;

  // For now, we'll simulate authentication
  // In a real implementation, this would use passport.authenticate()
  if (req.headers.authorization) {
    // Mock authentication - in real app, this would validate the token
    (req as any).user = { id: 'mock-user-id', username: 'mock-user' };
    return next();
  }

  // If no authorization header, return unauthorized
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Missing or invalid authentication token'
  });
};

// OAuth2 authentication route
export const oauth2Authenticate = passport.authenticate('oauth2', { scope: ['read', 'write'] });

// JWT authentication middleware
export const jwtAuthenticate = passport.authenticate('jwt', { session: false });