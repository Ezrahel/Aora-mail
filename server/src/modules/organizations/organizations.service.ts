import { prisma } from '../../lib/prisma';
import { AppError, forbidden, notFound } from '../../common/errors/app-error';

export async function getOrganization(organizationId: string, userId: string): Promise<unknown> {
  const membership = await prisma.organizationMember.findFirst({ where: { organizationId, userId } });
  if (!membership) throw forbidden('You do not belong to this organization.');
  const org = await prisma.organization.findUnique({ where: { id: organizationId }, include: { members: { include: { user: true } } } });
  if (!org) throw notFound('Organization not found.');
  return org;
}

export async function listUserOrganizations(userId: string): Promise<unknown[]> {
  const memberships = await prisma.organizationMember.findMany({ where: { userId }, include: { organization: true } });
  return memberships.map((m) => m.organization);
}

export async function updateOrganization(organizationId: string, userId: string, input: { name?: string }): Promise<unknown> {
  const membership = await prisma.organizationMember.findFirst({ where: { organizationId, userId } });
  if (!membership || !['owner', 'admin'].includes(membership.role)) throw forbidden();
  if (!input.name) throw new AppError(422, 'VALIDATION_ERROR', 'Name is required.');
  const org = await prisma.organization.update({ where: { id: organizationId }, data: { name: input.name } });
  return org;
}

export async function assertMembership(organizationId: string, userId: string): Promise<void> {
  const m = await prisma.organizationMember.findFirst({ where: { organizationId, userId } });
  if (!m) throw forbidden();
}
