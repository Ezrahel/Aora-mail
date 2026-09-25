import { prisma } from '../../lib/prisma';
import type { AuditAction } from '@prisma/client';

export async function createAuditLog(input: {
  action: AuditAction;
  actorId?: string;
  organizationId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId,
        organizationId: input.organizationId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata as unknown as object,
        requestId: input.requestId,
        ipAddress: input.ipAddress,
      },
    });
  } catch (err) {
    // Audit failure should not break main flow; log only
    const { logger } = await import('../../common/logging/logger');
    logger.warn({ err, action: input.action }, 'Failed to write audit log');
  }
}

export async function listAuditLogs(organizationId: string, opts: { page: number; limit: number }): Promise<{ data: unknown[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
    prisma.auditLog.count({ where: { organizationId } }),
  ]);
  return { data, total };
}
