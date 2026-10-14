import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const isWebhook = /^\/api(?:\/v1)?\/webhooks\//.test(req.path);
  const isAuth = /^\/api(?:\/v1)?\/auth\//.test(req.path);
  if (isWebhook || SAFE.has(req.method)) { next(); return; }
  const cookie = (req.cookies as Record<string, string> | undefined)?.aora_csrf;
  const header = req.header('x-csrf-token');
  // Authentication endpoints establish the token; all authenticated writes require it.
  if (isAuth && !cookie) {
    res.cookie('aora_csrf', crypto.randomBytes(32).toString('base64url'), { httpOnly: false, secure: env.isProduction, sameSite: 'lax', path: '/' });
    next(); return;
  }
  const valid = Boolean(cookie && header && cookie.length === header.length && crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header)));
  if (!valid) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Your session could not be verified. Refresh the page and try again.' } }); return;
  }
  next();
}
