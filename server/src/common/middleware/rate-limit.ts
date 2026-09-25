import rateLimit from 'express-rate-limit';
import { getRedis } from '../../lib/redis';

// Use Redis store if available, otherwise memory
export function createRateLimiter(opts: { windowMs: number; max: number; message?: string }) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: opts.message ?? 'Too many requests. Please try again later.' } },
    // Optionally use Redis — fallback to memory if unavailable
  });
}

export const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many login attempts. Please try again in 15 minutes.' });
export const registerLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many accounts created. Please try again later.' });
export const generalLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 100 });
export const domainVerifyLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 10, message: 'Too many verification attempts. Please wait a few minutes.' });
export const mailboxCreateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10 });
export const paymentLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10 });
