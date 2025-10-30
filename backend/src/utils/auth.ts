// backend/src/utils/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  businessId: string;
  email?: string;
  iat?: number;
  exp?: number;
};

// Middleware: exige Authorization: Bearer <token>
export function requireAuth(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) {
  try {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'Missing Authorization header' });

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Invalid Authorization format' });

    const secret = process.env.JWT_SECRET || 'changeme';
    const payload = jwt.verify(token, secret) as JwtPayload;
    if (!payload?.businessId) return res.status(401).json({ error: 'Invalid token payload' });

    req.user = payload;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized', detail: err?.message });
  }
}
