import { Router, Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../../common/validation/schemas';
import * as authService from './auth.service';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/app-error';

export const authRouter = Router();

function setSessionCookie(res: Response, token: string): void {
  res.cookie('aora_session', token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    domain: env.COOKIE_DOMAIN || undefined,
  });
}

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await authService.register({
      name: parsed.name,
      businessName: parsed.businessName,
      email: parsed.email,
      password: parsed.password,
    });
    setSessionCookie(res, result.token);
    res.status(201).json({ data: { user: result.user, organization: result.organization, token: result.token }, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await authService.login({ email: parsed.email, password: parsed.password });
    setSessionCookie(res, result.token);
    res.json({ data: { user: result.user, organization: result.organization, token: result.token }, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('aora_session', { path: '/' });
  res.json({ data: { success: true }, meta: {} });
});

authRouter.get('/session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = (req.cookies as Record<string, string> | undefined)?.['aora_session'] ?? req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.json({ data: null, meta: {} });
      return;
    }
    // Try verify
    const jwt = await import('jsonwebtoken');
    const payload = jwt.default.verify(token, env.JWT_SECRET) as { userId: string; organizationId: string };
    const { prisma } = await import('../../lib/prisma');
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    const org = await prisma.organization.findUnique({ where: { id: payload.organizationId } });
    if (!user || !org) {
      res.json({ data: null, meta: {} });
      return;
    }
    res.json({ data: { user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt.toISOString() }, organization: { id: org.id, name: org.name, ownerId: org.ownerId }, token }, meta: {} });
  } catch (err) { next(err); }
});

authRouter.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = String(req.body.email ?? '');
    if (!email) throw new AppError(422, 'VALIDATION_ERROR', 'Email is required.');
    await authService.requestPasswordReset(email);
    res.json({ data: { sent: true }, message: `If an account exists for ${email}, we sent reset instructions.`, meta: { requestId: req.requestId } });
  } catch (err) { next(err); }
});

authRouter.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Requires auth — token identifies user
    const token = (req.cookies as Record<string, string> | undefined)?.['aora_session'] ?? req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Please sign in to continue.');
    const jwt = await import('jsonwebtoken');
    const payload = jwt.default.verify(token, env.JWT_SECRET) as { userId: string };
    await authService.verifyEmail(payload.userId);
    res.json({ data: { verified: true }, message: 'Email verified successfully.', meta: {} });
  } catch (err) { next(err); }
});

authRouter.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) throw new AppError(422, 'VALIDATION_ERROR', 'Token and password are required.');
    await authService.resetPassword(token, password);
    res.json({ data: { success: true }, meta: {} });
  } catch (err) { next(err); }
});
