import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { logger } from '../logging/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req as unknown as { requestId?: string }).requestId;

  if (err instanceof AppError) {
    // Log 5xx only
    if (err.statusCode >= 500) {
      logger.error({ err: err.message, code: err.code, requestId, stack: err.stack }, 'Operational error');
    }
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
      },
      meta: { requestId },
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_';
      fieldErrors[path] = issue.message;
    }
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed. Please check your input.', fieldErrors },
      meta: { requestId },
    });
    return;
  }

  // Unknown error — never leak internals
  logger.error({ err, requestId, route: req.originalUrl }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    },
    meta: { requestId },
  });
}
