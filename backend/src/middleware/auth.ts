import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { Request, Response, NextFunction } from 'express';

export interface AuthedRequest extends Request {
  user?: { businessId: string };
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.user = { businessId: payload.businessId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function signToken(businessId: string) {
  return jwt.sign({ businessId }, config.jwtSecret, { expiresIn: '7d' });
}