import { prisma } from '../../lib/prisma';
import { notFound } from '../../common/errors/app-error';
import { getEmailProvider } from '../../providers/email/provider-registry';

export async function listForwarders(organizationId: string, domainId?: string): Promise<unknown[]> {
  return prisma.forwarder.findMany({ where: { organizationId, ...(domainId ? { domainId } : {}) } });
}

export async function createForwarder(organizationId: string, input: { domainId: string; source: string; destination: string }): Promise<unknown> {
  const emailProvider = getEmailProvider();
  const domain = await prisma.domain.findFirst({ where: { id: input.domainId, organizationId } });
  if (!domain) throw notFound('Domain not found.');
  const provider = await emailProvider.createForwarder({ domain: domain.name, source: input.source, destination: input.destination });
  return prisma.forwarder.create({
    data: {
      organizationId,
      domainId: domain.id,
      source: input.source,
      destination: input.destination,
      providerForwarderId: provider.id,
    },
  });
}

export async function deleteForwarder(id: string, organizationId: string): Promise<void> {
  const emailProvider = getEmailProvider();
  const fwd = await prisma.forwarder.findFirst({ where: { id, organizationId } });
  if (!fwd) throw notFound('Forwarder not found.');
  if (fwd.providerForwarderId) {
    const domain = await prisma.domain.findUnique({ where: { id: fwd.domainId } });
    await emailProvider.deleteForwarder({ forwarderId: fwd.providerForwarderId, domain: domain?.name ?? '', source: fwd.source });
  }
  await prisma.forwarder.delete({ where: { id } });
}
