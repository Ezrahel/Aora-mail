import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const existing = req.headers['x-request-id'] as string | undefined;
  const id = existing ?? uuid();
  (req as unknown as { requestId: string }).requestId = id;
  next();
}
