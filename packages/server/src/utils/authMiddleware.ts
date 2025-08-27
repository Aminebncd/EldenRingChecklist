import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthedRequest extends Request {
  user?: { id: string; role: 'user' | 'admin' };
}

export function auth(required = true) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : undefined;

    if (!token) {
      if (required) return res.status(401).json({ error: 'unauthorized' });
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        role: 'user' | 'admin';
      };
      req.user = { id: decoded.sub, role: decoded.role };
      next();
    } catch {
      return res.status(401).json({ error: 'invalid_token' });
    }
  };
}
