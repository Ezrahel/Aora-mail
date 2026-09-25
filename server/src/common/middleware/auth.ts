import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { unauthorized } from '../errors/app-error';
import { prisma } from '../../lib/prisma';

export interface AuthPayload {
  userId: string;
  organizationId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string; emailVerified: boolean };
      organizationId?: string;
      requestId?: string;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next(unauthorized());
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    // Attach payload; full user loaded lazily if needed
    (req as unknown as { authPayload: AuthPayload }).authPayload = payload;
    next();
  } catch {
    next(unauthorized('Session expired. Please sign in again.'));
  }
}

export async function loadUserMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const payload = (req as unknown as { authPayload?: AuthPayload }).authPayload;
  if (!payload) return next(unauthorized());
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return next(unauthorized());
  req.user = { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified };
  req.organizationId = payload.organizationId;
  next();
}

function extractToken(req: Request): string | null {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.['aora_session'];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || !req.organizationId) return next(unauthorized());
  next();
}
