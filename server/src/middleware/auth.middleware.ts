import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[auth] upload request rejected: missing bearer token', {
        method: req.method,
        path: req.originalUrl,
      });
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('[auth] request rejected: invalid bearer token', {
      method: req.method,
      path: req.originalUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
}
