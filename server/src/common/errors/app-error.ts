export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'DOMAIN_NOT_VERIFIED'
  | 'MAILBOX_LIMIT_EXCEEDED'
  | 'DOMAIN_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  | 'PROVIDER_ERROR'
  | 'MAILBOX_PROVISIONING_FAILED'
  | 'DOMAIN_PROVISIONING_FAILED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_VERIFICATION_FAILED'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'ENTITLEMENT_DENIED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string>,
    public readonly isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function unauthorized(message = 'Please sign in to continue.'): AppError {
  return new AppError(401, 'UNAUTHORIZED', message);
}
export function forbidden(message = 'You do not have permission to perform this action.'): AppError {
  return new AppError(403, 'FORBIDDEN', message);
}
export function notFound(message = 'Resource not found.'): AppError {
  return new AppError(404, 'NOT_FOUND', message);
}
export function conflict(code: ErrorCode, message: string, fieldErrors?: Record<string,string>): AppError {
  return new AppError(409, code, message, fieldErrors);
}
export function validationError(message: string, fieldErrors?: Record<string,string>): AppError {
  return new AppError(422, 'VALIDATION_ERROR', message, fieldErrors);
}
export function rateLimited(message = 'Too many requests. Please try again later.'): AppError {
  return new AppError(429, 'RATE_LIMITED', message);
}
