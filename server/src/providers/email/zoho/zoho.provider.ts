// Future provider stub — implements EmailProvider without rewriting frontend
// See providers/email/email-provider.interface.ts
import type {
  EmailProvider,
  CreateDomainInput,
  DeleteDomainInput,
  GetDomainInput,
  GetDomainDnsInput,
  CreateMailboxInput,
  UpdateMailboxInput,
  DeleteMailboxInput,
  SuspendMailboxInput,
  UnsuspendMailboxInput,
  CreateForwarderInput,
  DeleteForwarderInput,
  GetUsageInput,
  ProviderDomain,
  ProviderDnsRecords,
  ProviderMailbox,
  ProviderForwarder,
  ProviderUsage,
} from '../email-provider.interface';

export class ZohoProvider implements EmailProvider {
  readonly name = 'zoho';
  async createDomain(_input: CreateDomainInput): Promise<ProviderDomain> { throw new Error('Zoho provider not yet configured — use MXRoute'); }
  async deleteDomain(_input: DeleteDomainInput): Promise<void> { throw new Error('Zoho provider not yet configured'); }
  async getDomain(_input: GetDomainInput): Promise<ProviderDomain> { throw new Error('Zoho provider not yet configured'); }
  async getDomainDns(_input: GetDomainDnsInput): Promise<ProviderDnsRecords> { throw new Error('Zoho provider not yet configured'); }
  async createMailbox(_input: CreateMailboxInput): Promise<ProviderMailbox> { throw new Error('Zoho provider not yet configured'); }
  async updateMailbox(_input: UpdateMailboxInput): Promise<ProviderMailbox> { throw new Error('Zoho provider not yet configured'); }
  async deleteMailbox(_input: DeleteMailboxInput): Promise<void> { throw new Error('Zoho provider not yet configured'); }
  async suspendMailbox(_input: SuspendMailboxInput): Promise<void> { throw new Error('Zoho provider not yet configured'); }
  async unsuspendMailbox(_input: UnsuspendMailboxInput): Promise<void> { throw new Error('Zoho provider not yet configured'); }
  async createForwarder(_input: CreateForwarderInput): Promise<ProviderForwarder> { throw new Error('Zoho provider not yet configured'); }
  async deleteForwarder(_input: DeleteForwarderInput): Promise<void> { throw new Error('Zoho provider not yet configured'); }
  async getUsage(_input: GetUsageInput): Promise<ProviderUsage> { throw new Error('Zoho provider not yet configured'); }
}
