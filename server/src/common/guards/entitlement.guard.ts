import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import * as plansService from '../../modules/plans/plans.service';

export function requireEntitlement(check: (ent: import('../../modules/plans/plans.service').PlanEntitlements) => boolean, message?: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const orgId = req.organizationId;
    if (!orgId) return next(new AppError(401, 'UNAUTHORIZED', 'Please sign in.'));
    const ent = await plansService.getOrganizationEntitlements(orgId);
    if (!ent || !check(ent)) {
      return next(new AppError(403, 'ENTITLEMENT_DENIED', message ?? 'Your plan does not allow this action. Please upgrade.'));
    }
    next();
  };
}
