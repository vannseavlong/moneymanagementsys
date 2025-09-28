import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    name: string;
    accessToken: string;
  };
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // In development mode, allow requests without authentication
  if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
    (req as AuthenticatedRequest).user = {
      email: 'dev@test.com',
      name: 'Dev User',
      accessToken: 'dev-token'
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    (req as AuthenticatedRequest).user = decoded.user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}